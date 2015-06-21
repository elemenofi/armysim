'use strict';

class HQ {
	constructor (officers) {
		this.units = [];
		this.officers = officers;
	}
	
	add (unit) {
		this.units.push(unit);
	}

	update () {
    this.officers.update();
	
		this.units.map((unit) => {
			if (unit.commander.retired) {
				this.replace(unit.commander, unit);
			}
		});
	
		this.officers.retire();
	}

	replace (commander, unit) {
		console.log(commander, unit);
	}
}

export default HQ;
