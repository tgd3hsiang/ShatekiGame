// 輸入：桌面滑鼠(FPS 視角)、觸控、鍵盤、VR 手把與進入 VR 按鈕。
import { renderer, dom, rig } from './scene.js';
import { S } from './state.js';
import { gun, makeGun, fire } from './gun.js';
import { restart, readyMsg } from './game.js';
import { drawBoard } from './board.js';
import { HIP_SPREAD, ADS_SPREAD, VR_HIP_SPREAD, VR_AIM_GUIDE, ZERO } from './config.js';

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const deskSpread = ()=>HIP_SPREAD*(1-S.ads)+ADS_SPREAD*S.ads;

// 備案(無法鎖定滑鼠 / 觸控)：游標位置直接對應視角
function aimFromPointer(e){
  S.yaw = -(e.clientX/innerWidth*2-1)*.5;
  S.pitch = .02-(e.clientY/innerHeight*2-1)*.35;
}

export function initInput(){
  // ---- 滑鼠：鎖定後用相對位移轉視角 ----
  document.addEventListener('pointerlockchange',()=>{
    S.locked = document.pointerLockElement===dom; dom.style.cursor = S.locked?'none':'default';
  });
  document.addEventListener('pointerlockerror',()=>{ S.lockFailed=true; });
  dom.addEventListener('mousemove',e=>{
    if(renderer.xr.isPresenting) return;
    if(S.locked){
      const s = .0022*(1-.5*S.ads);        // 瞄準時靈敏度減半
      S.yaw = clamp(S.yaw-e.movementX*s,-.9,.9); S.pitch = clamp(S.pitch-e.movementY*s,-.5,.6);
    } else aimFromPointer(e);
  });
  dom.addEventListener('contextmenu',e=>e.preventDefault());
  // 用 mousedown/mouseup：右鍵按住時，左鍵仍會觸發(pointerdown 不會)
  dom.addEventListener('mousedown',e=>{
    if(renderer.xr.isPresenting) return;
    if(!S.locked && !S.lockFailed){        // 第一次點擊：鎖定滑鼠，不開槍
      try{ const p=dom.requestPointerLock(); if(p&&p.catch) p.catch(()=>{S.lockFailed=true}); }catch(_){ S.lockFailed=true; }
      return;
    }
    if(e.button===2) S.aiming=true;
    else if(e.button===0) fire(gun.userData.muzzle,deskSpread());
  });
  addEventListener('mouseup',e=>{ if(e.button===2) S.aiming=false; });

  // ---- 觸控：點一下開槍，長按 0.35 秒進入瞄準、放開時開火 ----
  let tHold=null;
  dom.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'||renderer.xr.isPresenting) return;
    e.preventDefault(); aimFromPointer(e);
    tHold=setTimeout(()=>{S.aiming=true},350);
  });
  dom.addEventListener('pointermove',e=>{ if(e.pointerType==='touch') aimFromPointer(e); });
  addEventListener('pointerup',e=>{
    if(e.pointerType!=='touch'||renderer.xr.isPresenting) return;
    clearTimeout(tHold); fire(gun.userData.muzzle,deskSpread()); S.aiming=false;
  });

  addEventListener('keydown',e=>{ if(e.key==='r'||e.key==='R') restart(); });

  // ---- VR：トリガー＝発射、グリップ長押し＝構え、A/B/X/Y ボタン＝やり直し(updateInput) ----
  for(let i=0;i<2;i++){
    const c = renderer.xr.getController(i);
    const g = makeGun(); g.scale.setScalar(.6); c.add(g); rig.add(c);
    // 構えている間だけ出る照準ガイド：銃口からゼロイン距離まで伸びる赤い線と点
    const guide = new THREE.Group(); guide.visible = false; c.add(guide);
    const muzzlePos = new THREE.Vector3(0,.012,-.264), farPos = new THREE.Vector3(0,.012,-ZERO);   // 銃口は銃モデルの .6 倍
    guide.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([muzzlePos,farPos]),new THREE.LineBasicMaterial({color:0xff3030,transparent:true,opacity:.55})));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.015,10,8),new THREE.MeshBasicMaterial({color:0xff3030})); dot.position.copy(farPos); guide.add(dot);
    let aim = false;
    c.addEventListener('squeezestart',()=>{ aim = true; guide.visible = VR_AIM_GUIDE; });
    c.addEventListener('squeezeend',()=>{ aim = false; guide.visible = false; });
    c.addEventListener('selectstart',ev=>{
      fire(g.userData.muzzle, aim ? ADS_SPREAD : VR_HIP_SPREAD);
      const h = ev.data && ev.data.gamepad && ev.data.gamepad.hapticActuators;     // コントローラーを振動させる
      try{ if(h && h[0]) h[0].pulse(.6,40); }catch(_){}
    });
  }
  // VR に入った／出たとき、スコアボードの案内文を切り替える
  const refreshBoard = ()=>{ if(S.phase==='ready') S.msg = readyMsg(); drawBoard(); };
  renderer.xr.addEventListener('sessionstart',refreshBoard);
  renderer.xr.addEventListener('sessionend',refreshBoard);
  const vrBtn = document.getElementById('vr');
  if(navigator.xr){
    navigator.xr.isSessionSupported('immersive-vr').then(ok=>{
      if(!ok) return;
      vrBtn.style.display='block';
      vrBtn.onclick = async()=>{
        try{
          const s = await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
          renderer.xr.setSession(s);
        }catch(err){ alert('VRを開始できません：'+err.message); }
      };
    }).catch(()=>{});
  }
}

// 毎フレーム呼ぶ：A/B/X/Y ボタンが押された瞬間にやり直し(デスクトップの R キーと同じ。いつでも有効)
let prevReset = false;
export function updateInput(){
  const sess = renderer.xr.getSession && renderer.xr.getSession();
  if(!sess) return;
  let down = false;
  for(const src of sess.inputSources){
    const b = src.gamepad && src.gamepad.buttons;      // xr-standard: [4]=A/X、[5]=B/Y
    if(b && ((b[4]&&b[4].pressed) || (b[5]&&b[5].pressed))) down = true;
  }
  if(down && !prevReset) restart();
  prevReset = down;
}
