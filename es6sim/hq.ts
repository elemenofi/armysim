
import * as moment from 'moment'
import config from './config';
import Operations from './operations';
import World from './world';
import Officer from './officer';
import Player from './player';
import Journal from './journal'
import Unit from './unit';
import Secretary from './secretary';
import { Operation } from './operation';

interface Window { army: any, engine: any, command: any }

declare var window: Window;

interface ReplaceSpec {
  aggresor?: Officer;
  replacedCommander: Officer;
  unitId: number;
  rank: string;
  rankToPromote: string;
}

export class HQ implements HQ {
  rawDate: moment.Moment;
  operations: Operations;
  activeOperations: Operation[];
  units: Unit[];
  realDate: string;
  player: Officer;
  world: World;
  target: Officer;
  planner: Officer;
  activeOfficers: Officer[];
  officersPool: Officer[];
  inspected: Officer;
  __officersID: number;
  secretary: Secretary;
  journal: Journal;

  constructor () {
    this.operations = new Operations();
    this.journal = new Journal(this);
    this.rawDate = moment();
    this.units = [];
    this.world = undefined;
    this.officersPool = [];
    this.activeOfficers = [];
    this.__officersID = 1;
    this.secretary = new Secretary();
    this.player = undefined;
    this.inspected = undefined;
  }

  updateDate () {
    this.rawDate = this.rawDate.add(1, "days");
    if (window.army.engine && window.army.engine.turn > config.bufferTurns) {
      // perf trick
      this.realDate = this.journal.formatDate();
    }
  }

  getDate (): moment.Moment {
    return this.rawDate
  }
 
  update (triggeredByUserAction?: boolean) {
    if (!triggeredByUserAction) this.updateDate();
    this.units.map(this.reserve.bind(this));
    this.reserve(window.army.command)
    this.operations.update(this);
    this.activeOfficers.forEach(officer => { if (officer) officer.update(this); });
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
    return this.officersPool.filter(officer => {
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
    return this.officersPool.filter(officer => { return officer.id === Number(officerId); })[0];
  }

  inspectOfficer (officerId: number) {
    var officer = this.findOfficerById(officerId);
    this.inspected = officer;
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
    return this.inspected;
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
    let lowerRank = this.secretary.rankLower(replacedCommander.rank);

    let spec = {
      aggresor: (replacedCommander.reason) ? replacedCommander.reason.officer : undefined,
      replacedCommander: replacedCommander,
      unitId: replacedCommander.unitId,
      rank: replacedCommander.rank.alias,
      rankToPromote: lowerRank,
    };

    if (lowerRank) {
      return this.candidate(spec);
    } else {
      return this.recruit(spec.rank, replacedCommander.unitId, false, this.findUnitById(spec.unitId).name);
    }
  }

  replaceForPlayer (replacedCommander: Officer) {
    return this.recruit('lieutenant', replacedCommander.unitId, true, this.findUnitById(replacedCommander.unitId).name);
  }

  recruit (rank: string, unitId: number, isPlayer?: boolean, unitName?: string) {
    let options = {
      date: this.realDate,
      id: this.__officersID,
      unitId: unitId,
      rankName: rank
    };

    let cadet = (isPlayer) ? new Player(options, this, unitName) : new Officer(options, this, unitName);

    if (isPlayer) this.player = cadet;

    this.activeOfficers[cadet.id] = cadet;
    this.officersPool.push(cadet);
    this.__officersID++;
    return cadet;
  }

  deassign (id: number) {
    this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
  }

  inspect (officer: Officer) {
    this.inspected = officer;
  }

  updateOfficers (HQ) {
  }

  candidate (spec: ReplaceSpec) {
    let parentUnit = this.units[spec.replacedCommander.unitId]
    let candidate = parentUnit.subunits[0].commander
    let candidateB = parentUnit.subunits[1].commander

    candidate = (candidate.experience > candidateB.experience) ? candidate : candidateB;
    // if the retirement of the previous office was because of an operation then the planner will be the promoted one if it is only
    // one rank below
    if (
      spec.aggresor &&
      !spec.aggresor.reserved &&
      spec.replacedCommander.rank.hierarchy === spec.aggresor.rank.hierarchy + 1
    ) {
      candidate = spec.aggresor
    }
    return this.promote(candidate, spec);
  }

  promote (officer: Officer, spec: ReplaceSpec) {
    this.deassign(officer.unitId);
    let promotion = this.promotion(officer, spec);
    officer.history.events.push(this.journal.promoted(spec.rank, spec.unitId));
    officer.targets = [];
    officer.commander = undefined;
    return officer;
  }

  promotion (officer: Officer, spec: any) {
    officer.unitId = spec.unitId;
    officer.rank = config.ranks[spec.rank];

    return {
      rank: spec.rank,
      date: this.journal.formatDate(),
      unit: this.findUnitById(officer.unitId).name
    };
  }
}

export default HQ;
