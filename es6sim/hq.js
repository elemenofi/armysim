'use strict';
import {} from './date.js';
import config from './config';
import Operations from './operations';

class HQ {
  constructor () {
    this.operations = new Operations();
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
        unit.commander.drifts(this.officers.active, this.units);
      }
    });
    
    this.officers.update(this);
    this.officers.retire();
    this.operations.update(this);
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
    unit.commander = this.officers.replace(unit.commander, this);
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
