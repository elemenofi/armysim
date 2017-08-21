'use strict';
// import {} from './lib/date.js';
import * as moment from 'moment'
import config from './config';
import Operations from './operations';
import World from './world';
import Officers from './officers';
import Officer from './officer';
import Player from './player';
import Unit from './unit';

interface Window { army: any, engine: any, command: any }

declare var window: Window;

export class HQ implements HQ {
  rawDate: any;
  officers: Officers;
  operations: Operations;
  units: Unit[];
  realDate: string;
  player: Officer;
  world: World;
  target: Officer;
  planner: Officer;

  constructor () {
    this.operations = new Operations();
    this.rawDate = moment();
    this.units = [] as any;
    this.officers = new Officers();
    this.world = undefined;
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
    this.reserve(window.army.command)
    this.operations.update(this);
    this.officers.update(this);
  }

  makePlayer () {
    let squads = this.findUnitsByType('squad');
    let unit = squads[config.random(squads.length) + 1];
    unit.commander.reserved = true;
    unit.commander = this.replaceForPlayer(unit.commander);
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

  findUnitById (id: number): Unit {
    return this.units[id];
  }

  findCommandingOfficer (officer: Officer): any {
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

  findOperationalStaff (officer: Officer, self?: boolean) {
    var operationalStaff: Officer[] = [];
    operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
    if (this.findPlayer() && self) operationalStaff.push(this.findPlayer())
    return operationalStaff;
  }

  findSubordinates (officer: Officer) {
    var subordinates: Officer[] = [];
    var unit = this.units.filter(unit => { return unit.id === officer.unitId;})[0];
    if (unit && unit.subunits) unit.subunits.forEach(subunit => {
      subordinates.push(subunit.commander);
    });
    return subordinates;
  }

  findInspected () {
    return this.officers.inspected;
  }

  add (unit: Unit) {
    this.units.push(unit);
  }

  reserve (unit: Unit) {
    if (unit.commander.reserved) this.replace(unit);
  }

  replace (unit: Unit) {
    unit.commander = this.replaceOfficer(unit.commander);
  }

  replaceOfficer (replacedCommander: Officer) {
    let lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);

    let spec = {
      aggresor: (replacedCommander.reason) ? replacedCommander.reason.officer : undefined,
      replacedCommander: replacedCommander,
      unitId: replacedCommander.unitId,
      rank: replacedCommander.rank.alias,
      rankToPromote: lowerRank,
      HQ: this
    };

    if (lowerRank) {
      return this.officers.candidate(spec);
    } else {
      return this.recruit(spec.rank, replacedCommander.unitId);
    }
  }

  replaceForPlayer (replacedCommander: Officer) {
    return this.recruit('lieutenant', replacedCommander.unitId, true);
  }

  recruit (rank: string, unitId: number, isPlayer?: boolean, unitName?: string) {
    let options = {
      date: this.realDate,
      id: this.officers.__officersID,
      unitId: unitId,
      rankName: rank
    };

    let cadet = (isPlayer) ? new Player(options, this, unitName) : new Officer(options, this, unitName);

    if (isPlayer) this.player = cadet;

    this.officers.active[cadet.id] = cadet;
    this.officers.pool.push(cadet);
    this.officers.__officersID++;
    return cadet;
  }

  deassign (id: number) {
    this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
  }

  inspect (officer: Officer) {
    this.officers.inspected = officer;
  }

  unitName (unitId: number, unitName: string) {
    let result = this.units.filter(unit => { return unit.id === unitId; })[0];
    if (!result) return unitName;
    return result.name;
  }
}

export default HQ;
