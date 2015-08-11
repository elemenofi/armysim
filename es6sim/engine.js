'use strict';
import Ui from './ui.jsx';
import config from './config';

class Engine {
  constructor(army) {
    this.army = army;
    this.ui = new Ui(this);
    this.turn = 0;
    this.running = true;
    this.start(this);
  }

  start (engine) {
    this.army.HQ.player();
    this.update();
    this.updateUI();
  }

  pause () {
    this.running = !this.running;
    if (this.running) this.update();
  }

  update () {
    this.turn++;
    this.army.HQ.update();

    if (this.running) setTimeout(() => { this.update() }, config.speed);
    console.log("running");
  }

  updateUI () {
    this.ui.render(this.army);
    setTimeout(() => { this.updateUI() }, config.speed);
  }
}

export default Engine;
