import { renderer, scene, camera } from './scene.js';
import './stall.js';
import { restart, updateGame } from './game.js';
import { updateView } from './view.js';
import { initInput } from './input.js';

const clock = new THREE.Clock();
initInput();
restart();

renderer.setAnimationLoop(()=>{
  const dt = Math.min(clock.getDelta(),.05);
  updateGame(dt);
  updateView(dt,clock.elapsedTime);
  renderer.render(scene,camera);
});
