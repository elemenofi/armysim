'use strict';

class Operations {
  constructor () {
    this.__operationsID = 1;
    this.ongoing = [];
  }

  add (officer, HQ, target, type) {
    let operation = new Operation(officer, HQ, target);
    operation.id = this.__operationsID;
    this.ongoing.push(operation);
    return operation;
  }

  update (HQ) {
    this.ongoing = this.ongoing.filter(operation => {
      if (!operation.done && !operation.failed &&
        !operation.lead.retired && !operation.target.retired) {
        return true;
      }
    });

    this.ongoing.forEach(operation => { operation.execute(HQ); });
  }
}

class Operation {
  constructor (officer, HQ, target, type) {
    this.types = {
      administration: {action: 'deviate', area: 'administration'},
      commanding: {action: 'coup', area: 'commanding'},
      diplomacy: {action: 'influence', area: 'diplomacy'},
      intelligence: {action: 'spy', area: 'intelligence'}
    };

    this.lead = officer;
    this.failed = null;
    this.done = null;
    this.strength = 0;
    this.side = (officer.alignment > 500) ? 'right' : 'left';

    if (type) {
      this.type = type;
    } else {
      this.type = this.types[officer.traits.base.area];
    }

    if (target) {
      this.target = target;
    } else {
      this.target = this.pick(officer, HQ);
    }

    if (this.target === undefined) this.failed = true;
  }

  pick (officer, HQ) {
    this.targets = HQ.officers.active.filter(officer => {
      if (officer.militancy > 5)  {
        if (
          officer.alignment > 500 && this.side === 'left' ||
          officer.alignment < 500 && this.side === 'right'
        ) {
          return true;
        }
      }
    }) || [];

    return this.targets[Math.ceil(Math.random() * this.targets.length)];
  }

  execute (HQ) {
    this.strength++;
    if (this.strength > 5)  {
      if (this.target[this.type.area] < this.lead[this.type.area]) {
        this.result = this[this.type.action](HQ.realDate);
        this.target.history.push('Forced to retire by ' + this.lead.name());
        this.target.retired = true;
        HQ.deassign(this.target.unitId);
        this.done = true;
      } else {
        this.failed = true;
      }
    }
  }

  deviate (date) {
    let result = 'Forced ' + this.target.name() +
    ' into retirement after revealing a fraudulent scheme on ' + date;
    this.lead.history.push(result);
    return result;
  }

  coup (date) {
    let result = 'Forced ' + this.target.name() +
    ' into retirement after taking control of his unit on ' + date;
    this.lead.history.push(result);
    return result;
  }

  influence (date) {
    let result = 'Forced ' + this.target.name() +
    ' into retirement after influencing key staff members on ' + date;
    this.lead.history.push(result);
    return result;
  }

  spy (date) {
    let result = 'Forced ' + this.target.name() +
    ' into retirement after revealing personal secrets on ' + date;
    this.lead.history.push(result);
    return result;
  }
}

export default Operations;
