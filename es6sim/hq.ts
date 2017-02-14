'use strict';
// import {} from './lib/date.js';
import * as moment from 'moment'
import config from './config';
import Operations from './operations';
import World from './world';
import Officers from './officers';
import Army from './typings';

interface Window { army: any }

declare var window: Window;

class HQ implements Army.HQ {
  rawDate: any;
  officers: Army.Officers;
  operations: Army.Operations;
  units: Army.Unit[];
  realDate: string;
  player: Army.Officer;
  world: any;
  target: Army.Officer;
  planner: Army.Officer;

  constructor () {
    this.operations = new Operations();
    this.rawDate = moment();
    this.units = [] as any;
    this.officers = new Officers();
    this.world = new World(this);
  }

  updateDate () {
    this.rawDate = this.rawDate.add(1, "days");
    if (window.army.engine && window.army.engine.turn > config.bufferTurns) {
      // perf trick
      this.realDate = config.formatDate(this.rawDate);
    }
  }

  update (triggeredByUserAction?: boolean) {
    if (!triggeredByUserAction) this.updateDate();
    this.units.map(this.reserve.bind(this));
    this.operations.update(this);
    this.officers.update(this);
  }

  makePlayer () {
    let squads = this.findUnitsByType('squad');
    let unit = squads[config.random(squads.length) + 1];
    unit.commander.reserved = true;
    unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
    this.player = unit.commander;
    this.planner = this.player;
  }

  findPlayer () {
    return this.officers.pool.filter(officer => {
      return officer.isPlayer
    })[0];
  }

  findUnitsByType (type: string) {
    return this.units.filter(unit => { return unit.type === type; });
  }

  findUnitById (id: number): Army.Unit {
    return this.units[id];
  }

  findCommandingOfficer (officer: Army.Officer): any {
    return (officer.commander) ? officer.commander : { name: () => { return 'No name' } };
  }

  findOfficerById (officerId: number) {
    return this.officers.pool.filter(officer => { return officer.id === Number(officerId); })[0];
  }

  inspectOfficer (officerId: number) {
    var officer = this.findOfficerById(officerId);
    this.officers.inspected = officer;
    return officer;
  }

  targetOfficer (officerId: number) {
    var officer = this.findOfficerById(officerId);
    var subordinates = this.findSubordinates(this.player) as any;

    // weird logic
    if (this.planner.id === officer.id && !officer.isPlayer) {
      this.target = officer;
      this.planner = this.player;
    } else if (officer.isPlayer || subordinates.includes(officer)) {
      this.planner = officer;
    } else {
      this.target = officer;
    }

    return officer;
  }

  findOperationalStaff (officer: Army.Officer, self?: boolean) {
    var operationalStaff: Army.Officer[] = [];
    operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
    if (this.findPlayer() && self) operationalStaff.push(this.findPlayer())
    return operationalStaff;
  }

  findSubordinates (officer: Army.Officer) {
    var subordinates: Army.Officer[] = [];
    var unit = this.units.filter(unit => { return unit.id === officer.unitId;})[0];
    if (unit && unit.subunits) unit.subunits.forEach(subunit => {
      subordinates.push(subunit.commander);
    });
    return subordinates;
  }

  findInspected () {
    return this.officers.inspected;
  }

  add (unit: Army.Unit) {
    this.units.push(unit);
  }

  reserve (unit: Army.Unit) {
    if (unit.commander.reserved) this.replace(unit);
  }

  replace (unit: Army.Unit) {
    unit.commander = this.officers.replace.call(this, unit.commander);
  }

  deassign (id: number) {
    this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
  }

  inspect (officer: Army.Officer) {
    this.officers.inspected = officer;
  }

  unitName (unitId: number, unitName: string) {
    let result = this.units.filter(unit => { return unit.id === unitId; })[0];
    if (!result) return unitName;
    return result.name;
  }
}

export default HQ;
