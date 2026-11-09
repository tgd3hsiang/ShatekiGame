// 獎品外觀：用基本幾何組合出來的小模型，貼圖全部用 Canvas 畫。
// 每個模型的原點都在碰撞形狀的中心，尺寸與 config.js 的碰撞形狀大致吻合。
import { canvasTex } from './textures.js';

const SPH = new THREE.SphereGeometry(1,20,14);
const std = (color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...o});
const JP = '"Noto Sans JP","Hiragino Sans","Yu Gothic","Noto Sans TC",sans-serif';
const SERIF = '"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho","Noto Serif TC",serif';
function ell(g,mat,r,x,y,z,rotZ=0){            // 橢球：r=[rx,ry,rz]
  const m = new THREE.Mesh(SPH,mat); m.scale.set(r[0],r[1],r[2]); m.position.set(x,y,z); m.rotation.z = rotZ; g.add(m); return m;
}

// 多邊形面 → 三角形，附每面獨立的 UV 與材質群組(第 i 面用 materials[i])
export function polyGeo(verts,faces){
  const pos=[], uv=[], g=new THREE.BufferGeometry(); let n=0;
  faces.forEach((f,fi)=>{
    const V = f.map(k=>new THREE.Vector3(...verts[k]));
    const e1 = V[1].clone().sub(V[0]).normalize();
    const nr = V[1].clone().sub(V[0]).cross(V[2].clone().sub(V[0])).normalize();
    const e2 = nr.clone().cross(e1);
    const P = V.map(v=>{const d=v.clone().sub(V[0]); return [d.dot(e1),d.dot(e2)];});
    const us=P.map(p=>p[0]), vs=P.map(p=>p[1]);
    const u0=Math.min(...us), u1=Math.max(...us), v0=Math.min(...vs), v1=Math.max(...vs);
    const start = n;
    for(let i=1;i<f.length-1;i++) [0,i,i+1].forEach(k=>{
      pos.push(...verts[f[k]]); uv.push((P[k][0]-u0)/(u1-u0||1),(P[k][1]-v0)/(v1-v0||1)); n++;
    });
    g.addGroup(start,n-start,fi);
  });
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.computeVertexNormals(); return g;
}

/* ---------- 紙盒零食：六面各自印刷 ---------- */
const SNACKS = [
  {n:'チョコ', a:'#4a2312', b:'#f3c34f', t:'#4a2312'},
  {n:'いちご', a:'#d9486b', b:'#fff0f3', t:'#b02850'},
  {n:'ラムネ', a:'#2f9bd6', b:'#eaf7ff', t:'#12507a'},
  {n:'ポップ', a:'#f0a81c', b:'#c7302a', t:'#fff6dd'}
];
const snackCache = {};
function snackMats(i){
  const d = SNACKS[i%SNACKS.length]; if(snackCache[d.n]) return snackCache[d.n];
  const face = (w,h,fn)=>new THREE.MeshStandardMaterial({roughness:.65,map:canvasTex(w,h,(g,W,H)=>{g.fillStyle=d.a;g.fillRect(0,0,W,H);fn(g,W,H);})});
  const front = face(440,280,(g,w,h)=>{
    g.fillStyle='rgba(255,255,255,.13)';                                   // 斜條紋
    for(let x=-h;x<w;x+=44){g.beginPath();g.moveTo(x,h);g.lineTo(x+22,h);g.lineTo(x+22+h,0);g.lineTo(x+h,0);g.fill();}
    g.fillStyle=d.b; g.beginPath(); g.ellipse(w/2,h/2+6,160,92,0,0,7); g.fill();   // 圓形標籤
    g.fillStyle=d.t; g.font=`bold 90px ${JP}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(d.n,w/2,h/2+10);
    g.fillStyle='#fff'; g.font=`bold 30px ${JP}`; g.fillText('おいしいおかし ★',w/2,36);
    g.font=`24px ${JP}`; g.fillText('内容量 20g',w/2,h-24);
  });
  const side = face(320,280,(g,w,h)=>{
    g.fillStyle=d.b; g.beginPath(); g.arc(w/2,h/2,95,0,7); g.fill();
    g.fillStyle=d.t; g.font=`bold 110px ${JP}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(d.n[0],w/2,h/2+8);
  });
  const top = face(440,320,(g,w,h)=>{ g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,h/2-3,w,6); g.fillStyle='#fff'; g.font=`bold 36px ${JP}`; g.textAlign='center'; g.fillText(d.n,w/2,h*.28); });
  const back = face(440,280,(g,w,h)=>{ g.fillStyle='#fff'; g.fillRect(40,60,w-80,h-120); g.fillStyle='#999'; for(let y=80;y<h-70;y+=22) g.fillRect(56,y,w-112-(y%3)*30,8); });
  const bottom = face(440,320,()=>{});
  return snackCache[d.n] = [side,side,top,bottom,front,back];   // +x,-x,+y,-y,+z,-z
}

/* ---------- 絨毛熊 ---------- */
const BEARS = [['#b8814f','#c9302c'],['#e8a8b8','#2f7fc1'],['#f1e2c6','#c9302c'],['#8a6a4a','#f0c030']];
function bear(idx){
  const [c,bow] = BEARS[idx%BEARS.length], g = new THREE.Group();
  const fur = std(c,{roughness:1}), light = std('#f4e4cc',{roughness:1}), dark = std('#2a1a14',{roughness:.4}), tie = std(bow,{roughness:.6});
  ell(g,fur,[.105,.115,.09],0,-.03,0);               // 身體
  ell(g,light,[.065,.07,.03],0,-.04,.07);            // 肚子
  ell(g,fur,[.085,.08,.08],0,.09,0);                 // 頭
  ell(g,light,[.035,.028,.03],0,.075,.075);          // 口鼻
  ell(g,dark,[.012,.009,.01],0,.085,.1);             // 鼻子
  [-1,1].forEach(s=>{
    ell(g,fur,[.03,.03,.025],s*.065,.16,0);          // 耳朵
    ell(g,dark,[.01,.012,.008],s*.03,.11,.072);      // 眼睛
    ell(g,fur,[.04,.05,.04],s*.12,-.02,.02,s*.4);    // 手
    ell(g,fur,[.045,.04,.05],s*.065,-.135,.03);      // 腳
    ell(g,tie,[.03,.02,.015],s*.03,.005,.08);        // 領結兩翼
  });
  ell(g,tie,[.012,.012,.012],0,.005,.085);           // 領結中心
  return g;
}

/* ---------- 招財貓 ---------- */
function neko(){
  const g = new THREE.Group();
  const white = std('#f6f1e6',{roughness:.35}), gold = std('#e8b830',{metalness:.7,roughness:.3});
  const red = std('#c9302c',{roughness:.5}), pink = std('#f0a0a8'), black = std('#222'), orange = std('#e8923a',{roughness:.5});
  ell(g,white,[.095,.11,.08],0,-.04,0);              // 身體
  ell(g,white,[.1,.075,.075],0,.08,0);               // 頭
  ell(g,orange,[.03,.035,.035],.075,.1,.03);         // 花紋(頭右)
  ell(g,black,[.045,.03,.03],-.07,-.02,-.04);        // 花紋(背)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.075,.012,8,24),red);
  collar.position.set(0,.02,.0); collar.rotation.x = Math.PI/2; g.add(collar);   // 紅項圈
  ell(g,gold,[.018,.018,.018],0,.015,.08);           // 鈴鐺
  const koban = ell(g,gold,[.04,.055,.01],0,-.05,.082);                          // 小判
  [-1,1].forEach(s=>{
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.032,.06,4),white);
    ear.position.set(s*.065,.155,0); ear.rotation.z = -s*.25; ear.rotation.y = Math.PI/4; g.add(ear);
    ell(g,pink,[.016,.026,.01],s*.062,.15,.014,-s*.25);                          // 耳內
    ell(g,black,[.014,.006,.006],s*.035,.095,.069);                              // 眼睛(瞇瞇眼)
    ell(g,pink,[.018,.012,.008],s*.055,.07,.058);                                // 腮紅
    [.072,.062].forEach(y=>{const w=new THREE.Mesh(new THREE.BoxGeometry(.05,.002,.002),black); w.position.set(s*.07,y,.06); w.rotation.z=s*(y>.07?.15:-.1); g.add(w);});   // 鬍鬚
  });
  ell(g,pink,[.012,.009,.008],0,.075,.075);          // 鼻子
  ell(g,white,[.03,.055,.03],-.105,.04,.045,-.2);    // 舉起的手
  ell(g,pink,[.016,.016,.008],-.1,.035,.072);        // 肉球
  ell(g,white,[.03,.045,.03],.075,-.04,.065);        // 抱小判的手
  return g;
}

/* ---------- 達摩 ---------- */
function daruma(){
  const g = new THREE.Group();
  const red = std('#d3281f',{roughness:.35}), cream = std('#f8ead2',{roughness:.5}), black = std('#161616',{roughness:.4}), gold = std('#e8b830',{metalness:.7,roughness:.3});
  ell(g,red,[.11,.11,.11],0,0,0);                    // 身體
  ell(g,cream,[.062,.058,.03],0,.035,.092);          // 臉
  [-1,1].forEach(s=>{
    ell(g,std('#fff'),[.016,.018,.006],s*.026,.045,.117);   // 眼白
    ell(g,black,[.008,.008,.005],s*.026,.045,.122);         // 瞳孔
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.03,.007,.006),black);
    brow.position.set(s*.03,.073,.118); brow.rotation.z = s*.35; g.add(brow);       // 粗眉
  });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.03,.004,.006),black); mouth.position.set(0,.0,.117); g.add(mouth);
  ell(g,gold,[.036,.036,.01],0,-.045,.097);          // 肚子上的金色圓章
  const kanji = new THREE.Mesh(new THREE.PlaneGeometry(.05,.05),new THREE.MeshBasicMaterial({transparent:true,map:canvasTex(64,64,(c)=>{
    c.fillStyle='#b3202a'; c.font=`bold 52px ${SERIF}`; c.textAlign='center'; c.textBaseline='middle'; c.fillText('福',32,34);})}));
  kanji.position.set(0,-.045,.1085); g.add(kanji);
  return g;
}

/* ---------- 彈力球 ---------- */
function ball(){
  const tex = canvasTex(256,128,(g,w,h)=>{
    for(let i=0;i<8;i++){ g.fillStyle=`hsl(${i*45},80%,55%)`; g.fillRect(i*w/8,0,w/8,h); }
    g.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<8;i++){ g.beginPath(); g.arc(i*w/8+w/16,h/2,9,0,7); g.fill(); }
  });
  return new THREE.Mesh(new THREE.SphereGeometry(.1,24,16),new THREE.MeshPhysicalMaterial({map:tex,roughness:.3,clearcoat:1,clearcoatRoughness:.1}));
}

/* ---------- 金字塔禮盒 ---------- */
function pyramidBox(T){
  const g = new THREE.Group();
  const side = new THREE.MeshStandardMaterial({roughness:.5,map:canvasTex(256,256,(c,w,h)=>{
    const gr=c.createLinearGradient(0,h,0,0); gr.addColorStop(0,'#a81c28'); gr.addColorStop(1,'#e84a4a'); c.fillStyle=gr; c.fillRect(0,0,w,h);
    c.fillStyle='rgba(255,230,160,.55)'; for(let y=20;y<h;y+=36) for(let x=(y/36%2?10:28);x<w;x+=36){c.beginPath();c.arc(x,y,5,0,7);c.fill();}
    c.fillStyle='#f2c14e'; c.fillRect(w/2-10,0,20,h); c.fillRect(0,h*.62,w,26);      // 金色緞帶(直、橫)
  })});
  const base = std('#7a1018');
  g.add(new THREE.Mesh(polyGeo(T.verts,T.faces),[base,side,side,side,side]));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.024,16,12),std('#f2c14e',{metalness:.8,roughness:.25}));
  tip.position.y = T.verts[4][1]+.012; g.add(tip);                                  // 頂端金球
  return g;
}

/* ---------- 三角巧克力盒 ---------- */
function prismBox(T){
  const mk = (w,h,fn)=>new THREE.MeshStandardMaterial({roughness:.6,map:canvasTex(w,h,fn)});
  const end = mk(256,256,(g,w,h)=>{ g.fillStyle='#4a2312'; g.fillRect(0,0,w,h); g.fillStyle='#f3c34f';
    g.beginPath(); g.moveTo(w*.2,h*.8); g.lineTo(w*.5,h*.25); g.lineTo(w*.8,h*.8); g.closePath(); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.moveTo(w*.42,h*.4); g.lineTo(w*.5,h*.25); g.lineTo(w*.58,h*.4); g.fill(); });
  const front = mk(480,352,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#f6d66a'); gr.addColorStop(1,'#e0a92a'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.fillStyle='#4a2312'; g.font=`bold 110px ${JP}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('ココア',w/2,h*.45);
    g.fillStyle='#b3202a'; g.fillRect(0,h*.78,w,h*.22); g.fillStyle='#fff'; g.font=`bold 34px ${JP}`; g.fillText('ミルクチョコレート',w/2,h*.89);
    g.fillStyle='#4a2312'; g.beginPath(); g.moveTo(30,h*.2); g.lineTo(70,h*.06); g.lineTo(110,h*.2); g.fill(); });
  const back = mk(480,352,(g,w,h)=>{ g.fillStyle='#4a2312'; g.fillRect(0,0,w,h); g.fillStyle='#d8b070'; for(let y=60;y<h-40;y+=28) g.fillRect(50,y,w-100-(y%4)*30,10); });
  const bottom = std('#4a2312');
  return new THREE.Mesh(polyGeo(T.verts,T.faces),[end,end,bottom,front,back]);
}

export function buildModel(type,T,idx=0){
  let m;
  switch(type){
    case 'snack':   m = new THREE.Mesh(new THREE.BoxGeometry(...T.size),snackMats(idx)); break;
    case 'bear':    m = bear(idx); break;
    case 'neko':    m = neko(); break;
    case 'daruma':  m = daruma(); break;
    case 'ball':    m = ball(); break;
    case 'pyramid': m = pyramidBox(T); break;
    case 'prism':   m = prismBox(T); break;
  }
  m.traverse(o=>{ if(o.isMesh){ o.castShadow = o.receiveShadow = true; } });
  return m;
}
