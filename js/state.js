// 執行期共用狀態。ES module 不能直接重新指派別的檔案匯出的 let 變數，所以集中放進一個物件。
export const S = {
  phase: 'ready',   // 'ready' 尚未開槍 → 'playing' → 'over' 已結算(鎖槍，按 R 重來)
  ammo: 0, score: 0, msg: '', endT: 0,
  aiming: false, ads: 0,           // ads：瞄準進度 0~1
  kick: 0, recoil: 0, cockT: 0,    // 槍的後座力、視角上抬、上膛倒數
  yaw: 0, pitch: .02,
  locked: false, lockFailed: false // 滑鼠鎖定狀態
};
export const prizes = [];   // {body, mesh, value, scored, t}
export const corks  = [];   // {body, mesh, age, finished, resolved, landed, touched:Set, scoreAtFire}
