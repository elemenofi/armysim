'use strict';

class HQ {
	constructor () {
		this.units = [];
	}
	
	add (unit) {
		this.units.push(unit);
	}

	update () {
		this.units.forEach(unit => {
			console.log(unit.name);
		});
	}
}

export default HQ;
