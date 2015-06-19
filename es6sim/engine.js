'use strict';
import Officers from './officers';
import Army from './army';
import Ui from './ui.jsx';

let officers = new Officers();
let army = new Army();
let ui = new Ui();

class Engine {
  constructor() {
    this.turn = 0;
  }
  
  start() {
    setInterval(this.update, 1000);
  }

  update() {
    this.turn++;
    console.log(army.units);
    officers.retire();
    officers.replenish();
    officers.update();
    ui.render(officers);
  }
}

export default Engine;