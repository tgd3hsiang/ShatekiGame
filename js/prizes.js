// 獎品生成：碰撞形狀(cannon)由 config 決定，外觀(three)由 models.js 決定。
import { scene, world, mat } from './scene.js';
import { TIERS, TYPES, LAYOUT } from './config.js';
import { prizes } from './state.js';
import { buildModel } from './models.js';

export function spawnPrizes(){
  const count = {};                                    // 每種獎品第幾個：用來輪流換花色
  LAYOUT.forEach((row,t)=>row.forEach((type,i)=>{
    const T = TYPES[type], x = -1.2+i*0.8, idx = count[type] = (count[type]||0)+1;
    const low = T.verts ? -Math.min(...T.verts.map(v=>v[1])) : T.r ? T.r : T.size[1]/2;   // 質心到底面
    const body = new CANNON.Body({mass:T.mass,material:mat,allowSleep:true,sleepSpeedLimit:.15,sleepTimeLimit:.5});
    body.linearDamping = .05; body.angularDamping = .2;
    if(T.verts) T.slabs.forEach(sl=>body.addShape(new CANNON.Box(new CANNON.Vec3(sl.hx,sl.hy,sl.hz)),new CANNON.Vec3(0,sl.y,0)));
    else if(T.r) body.addShape(new CANNON.Sphere(T.r));
    else body.addShape(new CANNON.Box(new CANNON.Vec3(T.size[0]/2,T.size[1]/2,T.size[2]/2)));
    body.position.set(x,TIERS[t]+0.03+low+0.01,-3.2); world.addBody(body);
    const mesh = buildModel(type,T,idx); scene.add(mesh);
    prizes.push({body,mesh,value:T.value,scored:false,t:0});
  }));
}
