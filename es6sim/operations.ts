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
    if (spec.officer.operations.length >= spec.officer.rank.hierarchy + 1) {
      return
    }
    if (spec.officer.id === spec.target.id) return
    let operation = new Operation(spec);
    operation.id = this.operationsID;
    this.operationsID++;
    this.active.push(operation);
    if (!spec.byPlayer) spec.officer.operations.push(operation);
    if (spec.byPlayer && !spec.officer.isPlayer) {
      spec.officer.operations.push(operation);
      HQ.player.operations.push(operation);
    }
    return operation;
  }

  update (HQ) {
    this.active = this.active.filter(operation => {
      if (
        !operation.target.reserved &&
        operation.turns > 0 && operation.target.rank
        && (operation.target.rank.hierarchy <= operation.officer.rank.hierarchy + 2)
      ) {
        return true;
      } else {
        operation.officer.operations.splice(operation.officer.operations.indexOf(operation), 1)
        return false;
      }
    });

    this.active.forEach(operation => {
      if (!operation.logged && operation.byPlayer) {
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
    var targetRoll = this.target[this.type] + config.random(10);
    var officerRoll = this.officer[this.type] + config.random(10);

    if ((officerRoll) > (targetRoll)) {
      this.strength++;
    }

    if (this.strength >= 300) {
      this.target.couped = true;
      this.target.reserve(HQ, this)
      this.officer.operations.splice(this.officer.operations.indexOf(this), 1)
      if (this.byPlayer) {
        HQ.findPlayer().operations.splice(HQ.findPlayer().operations.indexOf(this), 1)
      }
    }

    this.turns--;
  }
}

export default Operations;
