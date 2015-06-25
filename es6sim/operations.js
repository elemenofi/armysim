'use strict';

class Operations {
  constructor () {
    this.__operationID = 1;
    this.ongoing = [];
  }

  add (officer, HQ) {
    let operation = new Operation(officer, HQ);
    operation.id = this.__operationID;
    this.ongoing.push(operation);
    return operation.id;
  }

  update (HQ) {
    this.ongoing = this.ongoing.filter(operation => {
    	if (
    		!operation.done && !operation.failed &&
    		!operation.lead.retired && !operation.target.retired
    	) {
      	return true;
    	}
    });
    
    this.ongoing.map(operation => {
      operation.execute(HQ);
    });

  }
}

class Operation {
  constructor (officer, HQ) {
    this.types = {
      administration: {action: 'deviate', area: 'administration'},
      commanding: {action: 'coup', area: 'commanding'},
      diplomacy: {action: 'influence', area: 'diplomacy'},
      intelligence: {action: 'spy', area: 'intelligence'}
    };

    this.failed = null;
    this.done = null;
    
    this.side = (officer.alignment > 500) ? 'right' : 'left';
    this.type = this.types[officer.traits.base.area];
    this.strength = 0;
    
    this.lead = officer;
    this.target = this.pick(officer, HQ);
    if (this.target === undefined) this.failed = true;
  }

  pick (officer, HQ) {
    this.targets = HQ.officers.active.filter(officer => {
	    if (officer.militancy > 5)	{
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
    if (this.strength>5)  {
      if (this.target[this.type.area] < this.lead[this.type.area]) {
        this[this.type.action](HQ.realDate);
        HQ.deassign(this.target.unitId);
        this.done = true;
      } else {
        this.failed = true;
      }
    }
  }

  deviate (date) {
    this.lead.history.push(
      'Forced ' + this.target.name() + 
      ' into retirement after revealing a fraudulent scheme on ' + date
    );
  }

  coup (date) {
    this.lead.history.push(
      'Forced ' + this.target.name() + 
      ' into retirement after taking control of his unit on ' + date
    );
  }

  influence (date) {
    this.lead.history.push(
      'Forced ' + this.target.name() + 
      ' into retirement after influencing key staff members on ' + date
    );
  }

  spy (date) {
    this.lead.history.push(
      'Forced ' + this.target.name() + 
      ' into retirement after revealing personal secrets on ' + date
    );
  }
}

export default Operations;