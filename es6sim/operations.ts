'use strict';
import config from './config';
import Army from './typings';

interface Window { army: any }

declare var window: Window;

class Operations {
  operationsID: number;
  active: Operation[];

  constructor () {
    this.operationsID = 1;
    this.active = [];
  }

  add (spec: Operation, HQ: Army.HQ) {
    let o = spec.officer
    if (o.operations.length > o.rank.hierarchy) {
      return
    }

    if (o.id === spec.target.id) return
    let operation = new Operation(spec);
    operation.id = this.operationsID;
    this.operationsID++;
    this.active.push(operation);
    operation.officer.militancy = operation.officer.militancy - 250;
    if (!spec.byPlayer) o.operations.push(operation);
    if (spec.byPlayer && !o.isPlayer) {
      o.operations.push(operation);
      HQ.player.operations.push(operation);
    }
    return operation;
  }

  update (HQ) {
    this.active = this.active.filter(operation => {
      if (
        !operation.officer.reserved &&
        !operation.target.reserved &&
        operation.turns > 0 &&
        operation.target.rank &&
        operation.target.rank.hierarchy <= operation.officer.rank.hierarchy + 2
      ) {
        return true;
      } else {
        operation.officer.operations.splice(operation.officer.operations.indexOf(operation), 1)
        if (operation.byPlayer && !operation.officer.isPlayer) {
          HQ.player.operations.splice(HQ.player.operations.indexOf(operation), 1)
        }
        return false;
      }
    });

    this.active.forEach(operation => {
      if (!operation.logged && operation.byPlayer && operation.officer.isPlayer) {
        HQ.findPlayer().operations.push(operation)
        operation.logged = true;
      }
      operation.execute(HQ);
    });
  }
}

class Operation {
  id: number;
  officer: Army.Officer;
  target: Army.Officer;
  type: string;
  name: string;
  strength: number;
  turns: number;
  logged: boolean;
  byPlayer: boolean;

  constructor (spec) {
    this.officer = spec.officer;
    this.target = spec.target;
    this.type = spec.type;
    this.name = spec.name;
    this.strength = 0;
    this.turns = 1000;
    this.byPlayer = spec.byPlayer;
  }

  execute (HQ: Army.HQ): void {
    var targetRoll =
      this.target[this.type] +
      this.target.intelligence +
      this.target.rank.hierarchy +
      config.random(10);
    var officerRoll =
      this.officer[this.type] +
      this.officer.intelligence +
      this.officer.rank.hierarchy +
      config.random(10);

    // commander help if its not the commander itself against a subordinate
    if (this.target.commander && this.target.commander.id !== this.officer.id) {
      targetRoll += this.target.commander.rank.hierarchy
    }

    if (this.target.commander && this.target.commander.party === this.target.party) {
      targetRoll += this.target.commander.rank.hierarchy
    }

    if (this.officer.commander && this.officer.commander.party === this.officer.party) {
      officerRoll += this.officer.commander.rank.hierarchy
    }

    if ((officerRoll) > (targetRoll)) {
      this.strength++;
    }

    if (this.strength >= 300) {
      this.target.reserve(HQ, this)
      this.officer.prestige += 10
      this.officer.prestige += this.target.prestige
      if (window.army.engine && window.army.engine.turn > config.bufferTurns) this.officer.operations.splice(this.officer.operations.indexOf(this), 1)
      if (this.byPlayer) {
        if (window.army.engine && window.army.engine.turn > config.bufferTurns) HQ.findPlayer().operations.splice(HQ.findPlayer().operations.indexOf(this), 1)
      }
    }

    this.turns--;
  }
}

export default Operations;
