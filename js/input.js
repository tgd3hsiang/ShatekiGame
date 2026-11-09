// 輸入：桌面滑鼠(FPS 視角)、觸控、鍵盤、VR 手把與進入 VR 按鈕。
import { renderer, dom, rig } from './scene.js';
import { S } from './state.js';
import { gun, makeGun, fire } from './gun.js';
import { restart } from './game.js';
import { HIP_SPREAD, ADS_SPREAD } from './config.js';

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

  // ---- VR：手把上是同一把槍；扳機開槍，握把鍵在結算後重來 ----
  for(let i=0;i<2;i++){
    const c = renderer.xr.getController(i);
    const g = makeGun(); g.scale.setScalar(.6); c.add(g); rig.add(c);
    c.addEventListener('selectstart',()=>fire(g.userData.muzzle,.01));
    c.addEventListener('squeezestart',()=>{ if(S.phase==='over') restart(); });
  }
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
