// 攤位：木紋貨架與櫃檯、條紋遮雨棚、青海波布幕、紙燈籠、招牌、串燈，以及貨架聚光燈與陰影。
import { box, scene } from './scene.js';
import { TIERS, SHADOWS } from './config.js';
import { canvasTex, woodTex, seigaiha } from './textures.js';

const stdMat = o=>new THREE.MeshStandardMaterial({roughness:.85,...o});
const wood = (c,rep)=>stdMat({map:woodTex(c,rep)});
const SERIF_FONT = '"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho","Noto Serif TC",serif';

// 地面(碎石質感)
box(0,-0.05,0,30,0.1,30,stdMat({map:canvasTex(256,256,(g,w,h)=>{
  g.fillStyle='#2b2430'; g.fillRect(0,0,w,h);
  for(let i=0;i<2500;i++){ g.fillStyle=`rgba(${Math.random()<.5?'255,235,210':'0,0,0'},${Math.random()*.12})`; g.fillRect(Math.random()*w,Math.random()*h,2,2); }
},[10,10])}));

// 櫃檯：木頭 + 正面紅白條紋掛布
const w1 = wood('#8b5a2b',[2,1]);
const cloth = stdMat({map:canvasTex(128,64,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?'#f2ead8':'#b3202a'; g.fillRect(i*16,0,16,h); } },[3,1])});
box(0,0.5,-0.9,3.4,1,0.5,[w1,w1,w1,w1,cloth,w1]);

// 三層貨架與四根柱子
const shelf = wood('#9a6a38',[3,1]);
TIERS.forEach(y=>box(0,y,-3.2,3.4,0.06,0.7,shelf));
const post = wood('#5c3a1c',[1,3]);
[[-1.75,-0.85],[1.75,-0.85],[-1.75,-3.6],[1.75,-3.6]].forEach(([x,z])=>box(x,1.65,z,0.1,3.3,0.1,post));

// 後方布幕(同時擋住掉落的獎品；gun.js 用 z<-4 辨識它)：正面是青海波
const navy = stdMat({color:0x14264a});
box(0,1.65,-4.5,4,3.3,0.3,[navy,navy,navy,navy,stdMat({map:seigaiha()}),navy]);

// 遮雨棚：紅白條紋 + 前緣半圓裙邊
for(let i=0;i<8;i++){
  const c = i%2 ? 0xf2ead8 : 0xb3201f, x = -1.575+i*0.45;
  box(x,3.3,-2.2,0.45,0.06,2.8,stdMat({color:c}),false);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.12,0.02),stdMat({color:c})); flap.position.set(x,3.24,-0.8); scene.add(flap);
  const g = new THREE.CylinderGeometry(0.225,0.225,0.02,16,1,false,-Math.PI/2,Math.PI); g.rotateX(Math.PI/2);
  const scallop = new THREE.Mesh(g,stdMat({color:c})); scallop.position.set(x,3.18,-0.8); scene.add(scallop);
  flap.castShadow = scallop.castShadow = true;
}

// 招牌「射的」
const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.3),stdMat({emissive:0x330000,map:canvasTex(512,192,(g,w,h)=>{
  g.fillStyle='#a6161c'; g.fillRect(0,0,w,h); g.strokeStyle='#f2c14e'; g.lineWidth=10; g.strokeRect(8,8,w-16,h-16);
  g.fillStyle='#fff4e0'; g.font=`bold 130px ${SERIF_FONT}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('射的',w/2,h/2+6);
})}));
sign.position.set(0,2.72,-0.6); scene.add(sign);

// 紙燈籠：旋轉體 + 肋條貼圖 + 黑色上下蓋 + 金色流蘇
const ribs = canvasTex(64,256,(g,w,h)=>{
  g.fillStyle='#d8281c'; g.fillRect(0,0,w,h); g.fillStyle='rgba(60,0,0,.5)';
  for(let i=0;i<=10;i++) g.fillRect(0,i*(h-4)/10,w,4);
});
const lanternGeo = new THREE.LatheGeometry(Array.from({length:13},(_,i)=>{const t=i/12; return new THREE.Vector2(.06+.1*Math.sin(Math.PI*t),(t-.5)*.4);}),24);
const lanternMat = stdMat({map:ribs,emissiveMap:ribs,emissive:0xff4422,emissiveIntensity:.9,roughness:.6,side:THREE.DoubleSide});
const capMat = stdMat({color:0x151515}), gold = stdMat({color:0xe8b830,metalness:.7,roughness:.3});
[-1.4,-0.7,0.7,1.4].forEach(x=>{
  const l = new THREE.Group();
  l.add(new THREE.Mesh(lanternGeo,lanternMat));
  [.2,-.2].forEach(y=>{ const c=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.03,16),capMat); c.position.y=y; l.add(c); });
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(.02,.1,8),gold); tassel.position.y=-.27; tassel.rotation.x=Math.PI; l.add(tassel);
  l.position.set(x,2.78,-0.62); scene.add(l);
});

// 串燈：攤位內側下垂的小燈泡
const pts = [];
for(let i=0;i<=14;i++){ const t=i/14; pts.push(new THREE.Vector3(-1.65+3.3*t,3.2-.14*Math.sin(Math.PI*t),-1.8)); }
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x222222})));
const bulb = stdMat({color:0xffe3a0,emissive:0xffd070,emissiveIntensity:1.6});
pts.forEach(p=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(.028,10,8),bulb); b.position.copy(p).add(new THREE.Vector3(0,-.03,0)); scene.add(b); });

// 燈光：貨架聚光燈(陰影) + 兩盞暖色補光
const spot = new THREE.SpotLight(0xffd9a0,2.2,14,Math.PI/3,.6);
spot.position.set(0,3.1,-0.5); spot.target.position.set(0,1.4,-3.2); scene.add(spot,spot.target);
spot.castShadow = SHADOWS; spot.shadow.mapSize.set(1024,1024); spot.shadow.bias = -.0004;
[-1.2,1.2].forEach(x=>{ const p=new THREE.PointLight(0xff9a50,.5,5); p.position.set(x,2.7,-0.9); scene.add(p); });
