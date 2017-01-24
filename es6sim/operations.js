'use strict';
import config from './config';

class Operations {
  constructor () {
    this.operationsID = 1;
    this.active = [];
  }

  add (spec) {
    let operation = new Operation(spec);
    operation.id = this.operationsID;
    this.operationsID++;
    this.active.push(operation);
    return operation;
  }

  update (HQ) {
    this.active = this.active.filter(operation => {
      if (!HQ.player.reserved && !operation.target.reserved && operation.turns > 0) {
        return true;
      } else {
        alert(operation.name + ' ended.');
        return false;
      }
    });

    this.active.forEach(operation => { operation.execute(HQ); });
    if (this.active.length) console.log('active operations', this.active.length)
  }
}

class Operation {
  constructor (spec) {
    this.officer = spec.officer;
    this.target = spec.target;
    this.type = spec.type;
    this.name = spec.name;
    this.strength = 0;
    this.turns = 10;
  }

  execute (HQ) {
    var officerRoll = this.officer[this.type] + config.random(10);
    var targetRoll = this.target[this.type] + config.random(10);

    console.log(officerRoll, targetRoll);

    if ((officerRoll) > (targetRoll)) {
      this.strength++;
    }

    if (this.strength >= 3) {
      this.target.reserve(HQ, this)
    }

    this.turns--;
  }
}

export default Operations;
