'use strict';
import Ui from './ui.jsx';

class Engine {
  constructor(army) {
    this.ui = new Ui(this);
    this.army = army;
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

    if (this.running) {
      setTimeout(() => {
        this.update();
      }, 500);
    }
  }

  updateUI () {
    this.ui.render(this.army);
    setTimeout(() => {
      this.updateUI();
    }, 500);
  }
}

export default Engine;
