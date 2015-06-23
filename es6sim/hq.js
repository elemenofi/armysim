import {} from './date.js';
import config from './config';

'use strict';

class HQ {
  constructor (officers) {
    this.units = [];
    this.officers = officers;
    this.rawDate = new Date();
  }
  
  update () {
    this.rawDate = this.rawDate.addDays(config.days());
    this.realDate = config.formatDate(this.rawDate);

    this.units.map((unit) => {
      if (unit.commander.retired) {
        this.replace(unit);
      }
    });
    
    this.officers.update();
    this.officers.retire();
  }

  add (unit) {
    this.units.push(unit);
  }
  
  deassign (unitId) {
    this.units.some((unit) => {
      if (unit.id === unitId) {
        this.replace(unit);
        return true;
      }
    });
  }

  replace (unit) {
    unit.commander = this.officers.replace(unit.commander);
  }

  unitName (unitId) {
    let name = '';
    this.units.some((unit) => {
      if (unit.id === unitId) {
        name = unit.name;
        return true;
      }
    }); 
    return name;
  }
}

export default HQ;
