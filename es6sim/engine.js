'use strict';

class Engine {
  constructor() {
    this.turn = 0;
  }

  start (army) {
    this.army = army;
    this.update();
  }

  pause () {
    console.log("pause");
  }

  update() {
    this.turn++;
    this.army.HQ.update();
    this.ui.render(this.army);
    
    setTimeout(() => {
      this.update();
    }, 1000);
  }
}

export default Engine;
