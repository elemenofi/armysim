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
    this.update(engine);
  }

  pause () {
    this.running = !this.running;
    if (this.running) this.update();
  }

  update () {
    this.turn++;
    this.army.HQ.update();
    this.ui.render(this.army);

    if (this.running) {
      setTimeout(() => {
        this.update();
      }, 250);
    }
  }
}

export default Engine;
