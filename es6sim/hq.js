'use strict';
import {} from './date.js';
import config from './config';

class HQ {
  constructor () {
    this.rawDate = new Date();
    this.units = [];
  }

  updateDate () {
    this.rawDate = this.rawDate.addDays(config.random(150));
    this.realDate = config.formatDate(this.rawDate);
  }
  
  update () {
    this.updateDate();

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
