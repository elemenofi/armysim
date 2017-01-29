'use strict';
import VUi from './ui-game.jsx';
import Actions from './actions';
import config from './config';
import Army from './army';


class Engine {
  army: Army;
  running: boolean;
  ui: VUi;
  actions: Actions;
  turn: number;
  constructor (army) {
    this.army = army;
    this.ui = new VUi(this);
    this.actions = new Actions(this);
    this.turn = 0;
    this.running = true;
    this.start();
  }

  gameLoop;
  UILoop;

  getTurns () {
    return this.turn
  }

  start () {
    this.update();
    this.army.HQ.makePlayer();
    this.updateUI();
  }

  pause () {
    this.running = !this.running;
    if (this.running) this.update();
    if (this.running) this.updateUI();
  }

  update (triggeredByUserAction?) {
    while (this.turn < config.bufferTurns) {
      this.army.HQ.update();
      this.turn++;
    }

    this.army.HQ.update(triggeredByUserAction);
    this.turn++;

    if (this.running) {
      this.gameLoop = setTimeout(() => {
        this.update()
      }, config.speed);
    }
  }

  updateUI () {
    this.ui.render(this.army);
    if (this.running) {
      this.UILoop = setTimeout(() => {
        this.updateUI()
      }, config.speed);
    }
  }
}

export default Engine;
