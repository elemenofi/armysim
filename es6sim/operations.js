'use strict';
import config from './config';
import Comparisons from './comparisons'
let comparisons = new Comparisons();
class Operation {
	constructor (officer, HQ) {
		this.side = (officer.alignment > 500) ? 'right' : 'left';
		this.murder(this.side, HQ);
	}	
	murder (side, HQ) {
		let targets = HQ.officers.active.filter(officer => {
			return officer.alignment > 500 && side === 'left' || officer.alignment < 500 && side === 'right';
		}) || [];

		let target = targets[config.random(targets.length)] || {};

		target.retired = true;
		HQ.deassign(target.unitId);
	}
}

class Operations {
	constructor () {
		this.ongoing = [];
	}
	add (officer, HQ) {
		let operation = new Operation(officer, HQ);
		this.ongoing.push(operation);
		return operation;
	}
};

export default Operations;