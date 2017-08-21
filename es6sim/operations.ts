'use strict';
import config from './config';
import Officer from './officer';
import HQ from './HQ'
import Operation from './operation'

interface Window { army: any }

declare var window: Window;

export class Operations {
  operationsID: number;
  active: Operation[];

  constructor () {
    this.operationsID = 1;
    this.active = [];
  }

  add (spec: Operation, HQ: HQ) {
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

export default Operations;
