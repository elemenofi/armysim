'use strict';
import {} from './lib/date.js';
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
    this.units.map(this.reserve.bind(this));
    this.operations.update(this);
    this.officers.update(this);
    this.officers.reserve();
  }

  player () {
    let squads = this.findUnitsByType('squad');
    let unit = squads[config.random(squads.length) + 1];
    unit.commander.reserved = true;
    unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
    this.player = unit.commander;
  }

  findUnitsByType (type) {
    return this.units.filter(unit => { return unit.type === type; });
  }

  findUnitById (id) {
    return this.units.filter(unit => { return unit.id === id; })[0];
  }

  findCommandingOfficer (officer) {
    var officerUnit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
    var superiorUnit = this.units.filter(unit => { return unit.id === officerUnit.parentId; })[0];
    return superiorUnit.commander;
  }

  findOfficerById (officerId) {
    return this.officers.active.filter(officer => { return officer.id === Number(officerId); })[0];
  }

  findStaffById (officerId, playerUnitId) {
    debugger;
    var unit = this.units.filter(unit => { return unit.id === Number(playerUnitId); })[0];
    return unit.reserve.filter(officer => { return officer.id === Number(officerId); })[0];
  }

  findStaff (officer) {
    var staff = [];
    var unit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
    unit.reserve.forEach(officer => { staff.push(officer); });
    return staff;
  }

  findSubordinates (officer) {
    var subordinates = [];
    var unit = this.units.filter(unit => { return unit.id === officer.unitId;})[0];
    unit.subunits.forEach(subunit => {
      subordinates.push(subunit.commander);
    });
    return subordinates;
  }

  findOfficersByRank (rank) {
    return this.officers.active.filter(officer => {
      return officer.rank === rank;
    });
  }

  findActiveOfficers () {
    return this.officers.active;
  }

  add (unit) {
    this.units.push(unit);
  }

  reserve (unit) {
    if (unit.commander.reserved) this.replace(unit);
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
