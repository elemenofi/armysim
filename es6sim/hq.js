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
        this.replace(unit);
      }
    });
    
    this.officers.retire();
    this.officers.update();
  }

  replace (unit) {
    unit.commander = this.officers.replace(unit.commander);
  }

  deassign (unitId) {
    this.units.some((unit) => {
      if (unit.id === unitId) {
        this.replace(unit);
        return true;
      }
    });
  }
}

export default HQ;
