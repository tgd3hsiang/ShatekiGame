// 用 Canvas 程序化產生貼圖，不需要任何圖檔。
const cache = {};
export function canvasTex(w,h,draw,rep){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'),w,h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); }
  return t;
}
export function woodTex(base='#8b5a2b',rep=[2,1]){
  const k = base+rep; if(cache[k]) return cache[k];
  return cache[k] = canvasTex(256,256,(g,w,h)=>{
    g.fillStyle = base; g.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){                       // 木紋：隨機的細長曲線
      g.strokeStyle = `rgba(40,20,5,${.05+Math.random()*.12})`; g.lineWidth = 1+Math.random()*2;
      const y = Math.random()*h; g.beginPath(); g.moveTo(0,y);
      g.bezierCurveTo(w*.3,y+Math.random()*8-4,w*.6,y+Math.random()*8-4,w,y+Math.random()*6-3); g.stroke();
    }
  },rep);
}
// 青海波：祭典布幕常見的和風波紋
export const seigaiha = ()=>canvasTex(160,80,(g,w,h)=>{
  g.fillStyle = '#14264a'; g.fillRect(0,0,w,h); g.strokeStyle = '#dfe8fb'; g.lineWidth = 2;
  const r = 40;
  for(let row=-1;row<5;row++) for(let col=-1;col<5;col++){
    const cx = col*r*2+(row%2?r:0), cy = row*r/2;
    for(let k=1;k<=4;k++){ g.beginPath(); g.arc(cx,cy+r,k*r/4,Math.PI,0); g.stroke(); }
  }
},[3,2]);
