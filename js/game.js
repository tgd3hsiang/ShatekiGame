// 遊戲規則：重來、物理步進、得分、每一發的結果判定、結算。
import { scene, world } from './scene.js';
import { S, prizes, corks } from './state.js';
import { MAX_AMMO, SAFETY } from './config.js';
import { spawnPrizes } from './prizes.js';
import { drawBoard } from './board.js';
import { sfx } from './audio.js';

export function restart(){
  prizes.splice(0).forEach(p=>{world.removeBody(p.body);scene.remove(p.mesh)});
  corks.splice(0).forEach(c=>{world.removeBody(c.body);scene.remove(c.mesh)});
  S.ammo=MAX_AMMO; S.score=0; S.phase='ready'; S.endT=0; S.cockT=0; S.aiming=false;
  S.msg='クリックで開始、右クリックで構え';
  spawnPrizes(); drawBoard();
}

export function updateGame(dt){
  // 軟木塞高速飛行時，每步位移要小於半徑，否則會一步穿過獎品：飛行中用 1/480 秒，其餘用 1/180 秒
  const fast = corks.some(c=>c.body.velocity.lengthSquared()>9), h = fast ? 1/480 : 1/180;
  world.step(h,dt,Math.ceil(dt/h)+1);
  if(S.cockT>0) S.cockT-=dt;

  // 最後一發：等軟木塞都有結果、獎品都靜止或已掉落，才結算
  if(S.phase==='playing' && S.ammo===0){
    S.endT+=dt;
    const settled = corks.every(c=>c.resolved) && prizes.every(p=>p.scored||p.body.sleepState===CANNON.Body.SLEEPING);
    if(settled || S.endT>SAFETY){ S.phase='over'; S.aiming=false; drawBoard(); }
  }

  // 獎品同步 + 得分：掉出貨架(y<0.4)才算
  for(const p of prizes){
    p.mesh.position.copy(p.body.position); p.mesh.quaternion.copy(p.body.quaternion);
    if(!p.scored && p.body.position.y<0.4){
      p.scored=true;
      if(S.phase==='playing'){ S.score+=p.value; S.msg='獲得！+'+p.value; sfx('score'); drawBoard(); }
    }
    if(p.scored) p.t+=dt;
  }
  for(let i=prizes.length-1;i>=0;i--) if(prizes[i].t>2.5){world.removeBody(prizes[i].body);scene.remove(prizes[i].mesh);prizes.splice(i,1);}

  // 每一發的結果：有掉落 → 已顯示「得分」；碰到但沒掉 → 可惜；完全沒碰到 → 沒打中
  for(let i=corks.length-1;i>=0;i--){
    const c=corks[i]; c.age+=dt; c.mesh.position.copy(c.body.position);
    if(!c.finished && (c.landed || c.age>4 || (c.age>.3 && c.body.velocity.length()<.5))) c.finished=true;
    if(c.finished && !c.resolved){
      const calm = [...c.touched].every(q=>q.scored||q.body.sleepState===CANNON.Body.SLEEPING);
      if(calm || c.age>4){
        c.resolved=true;
        if(S.score<=c.scoreAtFire){ S.msg = c.touched.size ? '惜しい！落ちなかった' : 'はずれ'; drawBoard(); }
      }
    }
    if(c.age>4){world.removeBody(c.body);scene.remove(c.mesh);corks.splice(i,1);}
  }
}
