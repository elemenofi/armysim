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
    let squads = this.findByType('squad');
    let unit = squads[config.random(squads.length) + 1];
    unit.commander.retired = true;
    unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
    this.player = unit.commander;
  }

  findByType (type) {
    return this.units.filter(unit => { return unit.type === type; });
  }

  findPeers (rank) {
    return this.officers.active.filter(officer => {
      return officer.rank === rank;
    });
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

  deassign (id) {
    this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
  }

  inspect (officer) {
    this.officers.inspected = officer;
  }

  unitName (unitId, unitName) {
    let result = this.units.filter(unit => { return unit.id === unitId; })[0];
    if (!result) return unitName;
    return result.name;
  }
}

export default HQ;
