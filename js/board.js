// 計分板：畫在 Canvas 上當貼圖，桌面與 VR 都看得到。
// 只在事件發生時重畫(開槍、得分、這發結果確定、結算)，不靠計時更新。
import { scene } from './scene.js';
import { S } from './state.js';

const cv = document.createElement('canvas'); cv.width = 640; cv.height = 280;
const ctx = cv.getContext('2d');
const tex = new THREE.CanvasTexture(cv);
const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.79),new THREE.MeshBasicMaterial({map:tex}));
board.position.set(0,2.85,-2.75); scene.add(board);

export function drawBoard(){
  ctx.fillStyle='#1c0f0a'; ctx.fillRect(0,0,640,280);
  ctx.strokeStyle='#ffb347'; ctx.lineWidth=8; ctx.strokeRect(6,6,628,268);
  ctx.textAlign='center'; ctx.fillStyle='#fff4e0';
  if(S.phase==='over'){
    ctx.font='bold 54px sans-serif'; ctx.fillText('6 發結束',320,95);
    ctx.font='bold 84px sans-serif'; ctx.fillStyle='#ffb347'; ctx.fillText(S.score+' 分',320,190);
    ctx.font='28px sans-serif'; ctx.fillStyle='#fff4e0'; ctx.fillText('按 R（VR 按握把鍵）重新開始',320,247);
  } else {
    ctx.font='28px sans-serif'; ctx.fillText('分數',160,52); ctx.fillText('剩餘發數',480,52);
    ctx.font='bold 92px sans-serif'; ctx.fillStyle='#ffb347';
    ctx.fillText(S.score,160,142); ctx.fillText(S.ammo,480,142);
    ctx.font='bold 34px sans-serif'; ctx.fillStyle='#fff4e0';
    ctx.fillText(S.msg,320,225);
  }
  tex.needsUpdate = true;
}
