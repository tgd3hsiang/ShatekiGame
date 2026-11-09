// 渲染器、相機、物理世界。攤位在 stall.js。
import { SHADOWS } from './config.js';

export const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.shadowMap.enabled = SHADOWS;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const dom = renderer.domElement;
document.body.appendChild(dom);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0a1a);
scene.fog = new THREE.Fog(0x0b0a1a,7,18);

export const camera = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.05,50);
export const rig = new THREE.Group();     // VR 時 rig 就是玩家的位置
rig.position.set(0,0,2.2); rig.add(camera); scene.add(rig);
camera.position.set(0,1.5,0);
scene.add(new THREE.HemisphereLight(0xffd9a8,0x1a1030,0.55));

addEventListener('resize',()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

export const world = new CANNON.World();
world.gravity.set(0,-9.82,0); world.allowSleep = true; world.solver.iterations = 10;
export const mat = new CANNON.Material('m');
world.addContactMaterial(new CANNON.ContactMaterial(mat,mat,{friction:0.6,restitution:0.1}));

// 靜態方塊：物理碰撞 + 外觀。material 可以是顏色數字、單一材質，或 6 面材質陣列 [+x,-x,+y,-y,+z,-z]
export function box(x,y,z,w,h,d,material,physics=true){
  if(physics){
    const b = new CANNON.Body({mass:0,material:mat});
    b.addShape(new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)));
    b.position.set(x,y,z); world.addBody(b);
  }
  const mt = typeof material==='number' ? new THREE.MeshStandardMaterial({color:material,roughness:.85}) : material;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);
  m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}
