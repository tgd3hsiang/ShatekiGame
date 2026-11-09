// 軟木塞槍：模型、發射。軟木塞沿「槍管實際朝向」飛出，沒有任何自動瞄準。
import { renderer, camera, scene, world, mat } from './scene.js';
import { S, prizes, corks } from './state.js';
import { SPEED, CORK_R, COCK, ZERO } from './config.js';
import { sfx } from './audio.js';
import { drawBoard } from './board.js';

// 只有槍口前方一根準星(祭典軟木塞槍的樣式)，槍管朝 -Z
export function makeGun(){
  const g = new THREE.Group();
  const W = new THREE.MeshStandardMaterial({color:0x8b5a2b,roughness:.6});
  const M = new THREE.MeshStandardMaterial({color:0x2a2a30,metalness:.6,roughness:.4});
  const add = (geo,m,x,y,z,rx=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.x=rx;g.add(o);return o;};
  add(new THREE.BoxGeometry(.05,.1,.2),W,0,-.02,.1,-.1);                          // 槍托
  add(new THREE.BoxGeometry(.045,.12,.05),W,0,-.1,.02,.2);                        // 握把
  add(new THREE.CylinderGeometry(.018,.02,.44,12),M,0,.02,-.2,Math.PI/2);         // 槍管
  g.userData.cork = add(new THREE.CylinderGeometry(.015,.015,.035,10),new THREE.MeshStandardMaterial({color:0xd9b48a}),0,.02,-.42,Math.PI/2);
  add(new THREE.BoxGeometry(.006,.025,.006),M,0,.0475,-.4);                       // 槍口準星(頂端 y=.06 = config.SY)
  g.userData.bolt = add(new THREE.BoxGeometry(.02,.02,.05),M,.035,.03,-.05);      // 上膛拉桿
  const m = new THREE.Object3D(); m.position.set(0,.02,-.44); g.add(m); g.userData.muzzle = m;
  return g;
}
export const gun = makeGun();
camera.add(gun);                           // 桌面版：槍掛在鏡頭上(第一人稱)

export function shoot(origin,dir){
  if(S.phase!=='ready' && S.phase!=='playing') return;   // 結算後鎖槍，按 R 才重來
  if(S.ammo<=0 || S.cockT>0) return;
  if(S.phase==='ready') S.phase='playing';
  S.ammo--; S.endT=0; S.msg='';
  S.cockT=COCK; S.kick=1; if(!renderer.xr.isPresenting) S.recoil+=.02;

  const t = ZERO/SPEED;                    // 只補償「歸零距離」的下墜
  const body = new CANNON.Body({mass:.1,material:mat});
  body.addShape(new CANNON.Sphere(CORK_R));
  body.position.set(origin.x,origin.y,origin.z);
  body.velocity.set(dir.x*SPEED, dir.y*SPEED+0.5*9.82*t+SPEED*.008, dir.z*SPEED);
  body.linearDamping = .02; world.addBody(body);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(CORK_R,12,8),new THREE.MeshStandardMaterial({color:0xd9b48a}));
  scene.add(mesh);

  const cork = {body,mesh,age:0,finished:false,resolved:false,landed:false,touched:new Set(),scoreAtFire:S.score};
  corks.push(cork);
  body.addEventListener('collide',ev=>{    // 只記錄碰到了誰，結果由 game.js 判定
    const pz = prizes.find(q=>q.body===ev.body);
    if(pz) cork.touched.add(pz);
    else if(ev.body.mass===0 && (ev.body.position.y<0 || ev.body.position.z<-4)) cork.landed=true;   // 落地或撞到後方布幕
  });
  sfx('shot'); drawBoard();
}

// 從槍口物件取位置與朝向，加上隨機散布後發射
export function fire(mz,spread){
  mz.updateWorldMatrix(true,false);
  const m=new THREE.Vector3(), q=new THREE.Quaternion(), d=new THREE.Vector3(0,0,-1);
  mz.getWorldPosition(m); mz.getWorldQuaternion(q); d.applyQuaternion(q);
  d.x+=(Math.random()-.5)*2*spread; d.y+=(Math.random()-.5)*2*spread;
  shoot(m,d.normalize());
}
