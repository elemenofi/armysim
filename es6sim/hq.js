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
    this.units.map(this.retire.bind(this));
    this.operations.update(this);
    this.officers.update(this);
    this.officers.retire();
  }

  player () {
    let unit = this.units.filter(unit => { return unit.id === 414; })[0];
    unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
    debugger;
  }

  add (unit) {
    this.units.push(unit);
  }

  retire (unit) {
    if (unit.commander.retired) this.replace(unit);
  }

  replace (unit) {
    unit.commander = this.officers.replace.call(this, unit.commander);
  }

  deassign (unitId) {
    this.replace(this.units.filter(unit => { return unit.id === unitId; })[0]);
  }

  unitName (unitId) {
    return this.units.filter(unit => { return unit.id === unitId; })[0].name;
  }
}

export default HQ;
