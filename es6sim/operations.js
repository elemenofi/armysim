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
      if (!operation.done && operation.target && !operation.target.reserved) {
        return true;
      } else {
        alert(operation.name + ' ended.');
        return false;
      }
    });
    this.active.forEach(operation => { operation.execute(HQ); });
  }
}

class Operation {
  constructor (spec) {
    this.officer = spec.officer;
    this.target = spec.target;
    this.type = spec.type;
    this.name = spec.name;
    this.strength = 0;
    this.documents = [];
    this.done = false;
    this.fail = false;
    this.success = false;
  }

  execute (HQ) {
    var officerRoll = this.officer[this.type] + config.random(10);
    var targetRoll = this.target[this.type] + config.random(10);
    if ((officerRoll) > (targetRoll)) {
      this.strength++;
      console.log(this.strength);
    }
  }
}

export default Operations;



// 'use strict';
// import config from './config';
//
// class Operations {
//   constructor () {
//     this.__operationsID = 1;
//     this.active = [];
//   }
//
//   add (HQ, officer, target, type) {
//     let operation = new Operation(HQ, officer, target);
//     operation.id = this.__operationsID;
//     this.__operationsID++;
//     this.active.push(operation);
//     return operation;
//   }
//
//   update (HQ) {
//     this.active = this.active.filter(operation => {
//       return (!operation.done && !operation.lead.reserved && !operation.target.reserved);
//     });
//     this.active.forEach(operation => { operation.execute(HQ); });
//   }
// }
//
// class Operation {
//   constructor (officer, HQ, target, type) {
//     this.lead = officer;
//     this.side = (officer.alignment > 500) ? 'right' : 'left';
//     this.target = (target) ? target : this.pick(officer, HQ);
//     this.type = (type) ? type : config.operations[officer.traits.base.area];
//     this.strength = 0;
//     this.failed = (this.target) ? null : true;
//     this.done = null;
//   }
//
//   pick (officer, HQ) {
//     this.targets = HQ.officers.active.filter(officer => {
//       if (officer.militancy > 5)  {
//         if (
//           officer.alignment > 500 && this.side === 'left' ||
//           officer.alignment < 500 && this.side === 'right'
//         ) {
//           return true;
//         }
//       }
//     }) || [];
//
//     return this.targets[Math.ceil(Math.random() * this.targets.length)];
//   }
//
//   execute (HQ) {
//     this.strength++;
//     if (this.strength > 5)  {
//       if (this.target[this.type.area] < this.lead[this.type.area]) {
//         HQ.deassign(this.target.unitId);
//         this.done = true;
//         this.result = this[this.type.action](HQ.realDate);
//         this.target.reserved = true;
//         this.target.history.push('Forced on to reserve by ' + this.lead.name());
//       } else {
//         this.failed = true;
//       }
//     }
//   }
//
//   deviate (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after revealing a fraudulent scheme on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   coup (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after taking control of his unit on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   influence (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after influencing key staff members on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   spy (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after revealing personal secrets on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
// }
//
// export default Operations;
