// 桌面第一人稱視角：相機朝向、瞄準(ADS)、手晃、後座力、上膛動畫。VR 時由頭盔與手把接管。
import { renderer, camera } from './scene.js';
import { S } from './state.js';
import { gun } from './gun.js';
import { SY, COCK, HIP_SWAY, ADS_SWAY } from './config.js';

export function updateView(dt,time){
  const xr = renderer.xr.isPresenting;
  gun.visible = !xr;
  if(xr) return;

  S.ads += ((S.aiming?1:0)-S.ads)*Math.min(1,dt*10);
  S.recoil = Math.max(0,S.recoil-dt*4); S.kick = Math.max(0,S.kick-dt*7);
  const ads = S.ads;

  camera.fov = 60-18*ads; camera.updateProjectionMatrix();   // 瞄準時略放大
  camera.position.set(0,1.5,0);
  camera.rotation.set(S.pitch+S.recoil,S.yaw,0,'YXZ');

  // 手晃：兩組不同頻率的正弦疊加，瞄準時變小；槍口真的會晃，子彈也跟著晃
  const sw = HIP_SWAY*(1-ads)+ADS_SWAY*ads;
  const sx = (Math.sin(time*1.3)*.6+Math.sin(time*3.1)*.4)*sw;
  const sy = (Math.cos(time*1.1)*.6+Math.sin(time*2.7)*.4)*sw;

  // 腰射：槍在右下；瞄準：槍移到正中央，槍口準星落在畫面中心
  gun.position.set(.2*(1-ads), -.2*(1-ads)-SY*ads, -.42*(1-ads)-.2*ads+S.kick*.05);
  gun.rotation.set(sy+S.kick*.12, .04*(1-ads)+sx, 0);

  const bp = S.cockT>0 ? Math.sin(Math.PI*(1-S.cockT/COCK)) : 0;   // 上膛：拉桿往後拉再回來
  gun.userData.bolt.position.z = -.05+.07*bp;
  gun.userData.cork.visible = S.cockT<=0;
}
