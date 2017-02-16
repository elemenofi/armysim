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

    if (o.id === spec.target.id) return
    if (o.operations.length > o.rank.hierarchy + 1) return

    let operation = new Operation(spec);

    operation.id = this.operationsID;
    this.operationsID++;
    this.active.push(operation);

    if (!spec.byPlayer) o.operations.push(operation);

    if (spec.byPlayer && !o.isPlayer) {
      //add proxy operation
      o.operations.push(operation);
      HQ.player.operations.push(operation);
    }

    return operation;
  }

  update (HQ) {
    this.active = this.active.filter(operation => {
      let o = operation.officer
      let t = operation.target
      if (
        !o.reserved &&
        !t.reserved &&
        operation.turns > 0 &&
        t.rank &&
        t.rank.hierarchy <= o.rank.hierarchy + 2
      ) {
        return true;
      } else {
        // remove proxy operation
        o.operations.splice(o.operations.indexOf(operation), 1)
        o.completed.push(operation)
        if (operation.byPlayer && !o.isPlayer) {
          HQ.player.operations.splice(HQ.player.operations.indexOf(operation), 1)
          HQ.player.completed.push(operation)
        }
        return false;
      }
    });

    this.active.forEach(operation => {
      if (!operation.logged && operation.byPlayer && operation.officer.isPlayer) {
        // push only main ops to players array
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

  roll (officer: Army.Officer): number {
    let o = officer;
    let roll;
    roll =
      o[this.type] +
      o.intelligence +
      o.rank.hierarchy +
      config.random(10);

    roll += (o.commander && o.commander.party === o.party) ? o.commander.rank.hierarchy : 0;

    return roll;
  }

  execute (HQ: Army.HQ): void {
    var targetRoll = this.roll(this.target)
    var officerRoll = this.roll(this.officer)

    if ((officerRoll) > (targetRoll)) {
      this.strength++;
    }

    if (this.strength >= 300) {
      this.target.reserve(HQ, this)
      this.officer.prestige += 10
      this.officer.prestige += this.target.prestige
      this.officer.operations[this.officer.operations.indexOf(this)] = undefined;
      this.officer.completed.push(this)
      if (this.byPlayer) {
        HQ.findPlayer().operations[HQ.findPlayer().operations.indexOf(this)] = undefined;
        HQ.findPlayer().completed.push(this)
      }
    }

    this.turns--;
  }
}

export default Operations;
