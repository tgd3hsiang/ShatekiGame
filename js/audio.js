// WebAudio 合成音效，不需要音檔。
let ac;
export function sfx(kind){
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(), g=ac.createGain(), t=ac.currentTime;
    o.connect(g); g.connect(ac.destination);
    if(kind==='shot'){
      o.type='square'; o.frequency.setValueAtTime(320,t); o.frequency.exponentialRampToValueAtTime(70,t+.1);
      g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.001,t+.12); o.start(t); o.stop(t+.12);
    } else {
      o.type='triangle'; o.frequency.setValueAtTime(660,t); o.frequency.setValueAtTime(990,t+.08);
      g.gain.setValueAtTime(.2,t); g.gain.exponentialRampToValueAtTime(.001,t+.3); o.start(t); o.stop(t+.3);
    }
  }catch(e){}
}
