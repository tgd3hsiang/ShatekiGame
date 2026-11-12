// 所有可調整的遊戲參數與獎品資料都集中在這裡。

// ---- 規則 ----
export const MAX_AMMO = 6;       // 每局發數
export const SAFETY   = 8;       // 最後一發後的保險上限(秒)：避免獎品一直晃動而卡住結算

// ---- 槍與軟木塞 ----
export const SPEED    = 20;      // 軟木塞初速(m/s)
export const CORK_R   = .045;    // 軟木塞半徑(m)
export const COCK     = .8;      // 每發上膛時間(秒)
export const ZERO     = 5.2;     // 歸零距離(m)：只補償這個距離的重力下墜，其他距離會有落差
export const SY       = .06;     // 槍口準星頂端高度(槍模型座標)，瞄準時對齊畫面中心

// ---- 難度 ----
export const HIP_SPREAD = .04;   // 隨機散布(弧度)：腰射
export const ADS_SPREAD = .004;  // 瞄準
export const VR_HIP_SPREAD = .02;  // VR：構えていない(グリップを握っていない)ときの散らばり
export const VR_AIM_GUIDE = true; // VR：構えたとき赤い照準ガイドを出す(本物の射的らしさ重視なら false)
export const HIP_SWAY   = .022;  // 手晃幅度(弧度)：腰射
export const ADS_SWAY   = .009;  // 瞄準

// ---- 畫質 ----
export const SHADOWS = true;     // 貨架聚光燈陰影；VR 頭盔效能不足時改成 false

// ---- 貨架 ----
export const TIERS = [0.9, 1.4, 1.9];                // 三層貨架高度(m)

// ---- 獎品 ----
// 多面體頂點以質心為原點，面的頂點順序為「從外側看逆時針」(three 與 cannon 通用)。
// 物理形狀用 SLABS 層由寬到窄的方塊疊起來逼近：cannon.js 的「球 vs 多面體」高速下會穿透，「球 vs 方塊」穩定。
// 外觀(models.js)與碰撞形狀分開：外觀可以很細緻，碰撞只用簡單形狀，兩者尺寸要大致吻合。
const SLABS = 6;
const layer = i => (i+.5)/SLABS;
// 四角錐：底邊半長 a、高 h
const pyramid = (a,h)=>({
  verts:[[-a,-h/4,-a],[a,-h/4,-a],[a,-h/4,a],[-a,-h/4,a],[0,3*h/4,0]],
  faces:[[0,1,2,3],[3,2,4],[2,1,4],[1,0,4],[0,3,4]],
  slabs:Array.from({length:SLABS},(_,i)=>{const f=layer(i); return {hx:a*(1-f),hy:h/(2*SLABS),hz:a*(1-f),y:-h/4+f*h};})
});
// 三角柱(橫躺的三角巧克力盒)：長 L(沿 x)、底 b(沿 z)、高 h
const prism = (L,b,h)=>({
  verts:[[-L/2,-h/3,b/2],[L/2,-h/3,b/2],[L/2,-h/3,-b/2],[-L/2,-h/3,-b/2],[-L/2,2*h/3,0],[L/2,2*h/3,0]],
  faces:[[0,4,3],[1,2,5],[0,3,2,1],[0,1,5,4],[2,3,4,5]],   // 左端、右端、底、前斜面、後斜面
  slabs:Array.from({length:SLABS},(_,i)=>{const f=layer(i); return {hx:L/2,hy:h/(2*SLABS),hz:b/2*(1-f),y:-h/3+f*h};})
});

export const TYPES = {
  snack:  {size:[.22,.14,.16], mass:.2,  value:10},    // 紙盒零食
  ball:   {r:.1,               mass:.15, value:10},    // 彈力球
  daruma: {r:.11,              mass:.6,  value:30},    // 達摩
  neko:   {size:[.22,.3,.18],  mass:.9,  value:40},    // 招財貓
  bear:   {size:[.26,.34,.2],  mass:1.1, value:40},    // 絨毛熊
  pyramid:{...pyramid(.15,.36), mass:1.2, value:50},   // 金字塔禮盒：底 .3 × .3，高 .36
  prism:  {...prism(.34,.24,.22), mass:.9, value:30}   // 三角巧克力盒：長 .34，底 .24，高 .22
};
// 由下往上三層，每層 4 個，x 由左到右
export const LAYOUT = [
  ['pyramid','neko','bear','prism'],
  ['snack','daruma','snack','bear'],
  ['snack','ball','snack','ball']
];
