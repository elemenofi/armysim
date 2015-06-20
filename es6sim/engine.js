'use strict';
import Officers from './officers';
import Army from './army';
import Ui from './ui.jsx';

let officers = new Officers();
let army = new Army(officers);
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
    // sweeps through officers with retire = true;
    officers.retire();
    // gives experience to officers, promotes them if they should be,
    // or toggles retire = true if they should retire
    officers.update();
    army.HQ.update();
    // passes the objects to react
    ui.render(officers, army);
  }
}

export default Engine;
