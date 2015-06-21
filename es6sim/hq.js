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
		this.units.map((unit) => {
			if (unit.commander.retired) {
				replace(unit);
			}
		});
		this.officers.retire();
	}

	replace (unit) {
		
	}
}

export default HQ;
