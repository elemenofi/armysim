'use strict';
import Army from './army';
import Ui from './ui.jsx';

let army = new Army();
let ui = new Ui();

class Engine {
  constructor() {
    this.turn = 0;
  }

  start() {
    let count = 0;
    while (count < 200) {
      this.update();
      count++;
    }
    setInterval(this.update, 500);
  }

  turn () {
    return this.turn;
  }

  update() {
    this.turn++;
    army.HQ.update();
    ui.render(army);
  }
}

export default Engine;
