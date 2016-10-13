'use strict';
import Ui from './ui-game.jsx';
import config from './config';

class Engine {
  constructor(army) {
    this.army = army;
    this.ui = new Ui(this);
    this.turn = 0;
    this.running = true;
    this.start(this);
  }

  start () {
    this.update();
    this.army.HQ.player();
    this.updateUI();
  }

  pause () {
    this.running = !this.running;
    if (this.running) this.update();
  }

  update () {
    while (this.turn < config.bufferTurns) {
      this.army.HQ.update();
      this.turn++;
    }
    okok
    this.army.HQ.update();
    this.turn++;

    if (this.running) setTimeout(() => { this.update() }, config.speed);
  }

  updateUI () {
    this.ui.render(this.army);
    setTimeout(() => { this.updateUI() }, config.speed);
  }
}

export default Engine;
