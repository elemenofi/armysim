'use strict';
import config from './config';
import Officers from './officers';

class Engine {
  constructor() {
    this.entities = new Officers(config.staffSize);
    this.turn = 0;
  }
  
  start() {
    let update = () => {
      this.turn++;
      this.update();
      console.log(this.entities.staff);
    };

    setInterval(update, 1000);
  }

  update() {
    this.entities.update();
  }
}

export default Engine;