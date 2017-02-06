/* global Chance */
'use strict';
import config from './config';
import Traits from './traits';
import Army from './typings';
import * as chance from './lib/chance';

interface Chance {
  last(): string;
  first(o: Army.FirstNameSpec): string
  word(l: number): string;
}

class Officer implements Army.Officer {
  lname: string;
  fname: string;
  id: number;
  isPlayer: boolean;
  unitId: number;
  reserved: boolean;
  experience: number;
  prestige: number;
  intelligence: number;
  diplomacy: number;
  commanding: number;
  alignment: number;
  militancy: number;
  drift: number;
  history: string[];
  rank: Army.Rank;
  operations: Army.Operation[];
  unit: Army.Unit;
  commander: Army.Officer;
  traits: { base: Army.Trait };
  chance: any;
  couped: boolean;
  reason: Army.Operation;
  includes: boolean;
  targets: number[];
  party: string;
  militant: boolean;

  constructor (spec: Army.OfficerSpec, HQ: any, unitName: string) {
    let traits = new Traits();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.reserved = false;

    this.rank = config.ranks[spec.rankName];
    this.experience = config.ranks[spec.rankName].startxp + config.random(500);
    this.prestige = config.random(10);
    // this.prestige = config.ranks[spec.rankName].startpr + config.random(10);

    this.traits = { base: traits.random() };
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);

    this.alignment = config.random(10000);
    this.militant = false;
    this.militancy = 0;
    this.drift = Math.floor(Math.random() * 2) == 1 ? 1 : -1; //

    this.operations = [];
    this.history = [];
    this.targets = []

    this.chance = chance(Math.random);
    this.lname = this.chance.last();
    this.fname = this.chance.first({gender: 'male'});

    if (this.isPlayer) {
      this.lname = (config.debug) ? 'Richardson' : prompt('Name?');
      this.fname = 'John';
    }

    this.graduate({
      date: config.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName),
      HQ: HQ
    });
  }

  name () {
    return (!this.reserved) ?
      this.rank.title + ' ' + this.fname + ' ' + this.lname :
      this.rank.title + ' (R) ' + this.fname + ' ' + this.lname;
  }

  graduate (spec: any) {
    let graduation = { unit: spec.unitName, date: spec.date };
    this.history.push(config.graduated(graduation, this));
  }

  update (HQ: Army.HQ) {
    if (this.reserved) HQ.officers.active[this.id] = undefined;
    this.drifts(HQ);
    this.militate(HQ);
    this.align();

    this.experience++;
    if (!this.reserved && this.experience > this.rank.maxxp) this.reserve(HQ);
  }

  drifts (HQ: Army.HQ) {
    let unit = HQ.findUnitById(this.unitId);
    let parent = HQ.findUnitById(unit.parentId);
    if (parent) {
      this.commander = parent.commander;
    } else {
      this.commander = undefined
    }
    this.party = (this.alignment > 5000) ? 'Conservative' : 'Radical';
  }

  align () {
    if (this.drift > 0 && this.alignment < 10000) {
      this.alignment += this.drift;
    } else if (this.drift < 0 && this.alignment > 0) {
      this.alignment += this.drift;
    }
  }

  operationDelay (): number {
    return 1000;
  }

  militate (HQ: Army.HQ) {
    this.militant = (
      this.alignment > 9000 ||
      this.alignment < 1000 ||
      this.commander &&
      this.commander.party !== this.party
    ) ? true : false;

    this.militancy += (this.militant && this.militancy < this.operationDelay()) ? 1 : 0;

    if (this.militancy === this.operationDelay()) {
      this.startOperation(HQ);
    }
  }

  startOperation (HQ) {
    let targets = this.chooseTarget(HQ);
    if (!targets.length) return;

    targets.forEach((target) => {
      if (
        this.militancy > 249 &&
        target &&
        !this.isPlayer &&
        !this.reserved &&
        this.operations.length <= this.rank.hierarchy &&
        !this.targets[target.id]
      ) {
        let spec = {
          officer: this,
          target: target,
          type: this.traits.base.area,
          name: '',
        };

        var word = this.chance.word();
        word = word.replace(/\b\w/g, l => l.toUpperCase());
        spec.name = 'Operation ' + word
        HQ.operations.add(spec);
        this.targets[target.id] = target.id;
      }
    })
  }

  chooseTarget (HQ: Army.HQ): Army.Officer[] {
    let targets = [];
    let commander = this.commander;
    if (this.commander && this.commander.party !== this.party) targets.push(commander);

    let allSubordinates = (HQ: Army.HQ, officer: Army.Officer, quantity: number): void => {
      if (quantity === -1) return
      if (HQ.units[officer.unitId]) {
        let commander1 = HQ.units[officer.unitId].subunits[0].commander;
        let commander2 = HQ.units[officer.unitId].subunits[1].commander;
        targets.push(commander1)
        targets.push(commander2)
        allSubordinates(HQ, commander1, commander1.rank.hierarchy - 1)
        allSubordinates(HQ, commander2, commander2.rank.hierarchy - 1)
      }
    }

    allSubordinates(HQ, this, this.rank.hierarchy - 1);

    return targets;
  }



  reserve (HQ, reason?: Army.Operation) {
    var lastUnit = HQ.units[this.unitId]

    if (this.rank.hierarchy >= 4) lastUnit.reserve.unshift(this);
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();

    this.reserved = true;

    if (!reason) this.history.push('Moved to reserve on ' + config.formatDate(HQ.rawDate));

    if (reason) {
      this.reason = reason;
      let lastRecord = this.history[this.history.length - 1];
      let success = reason.name + ' moved ' + reason.target.name() + ' to reserve on ' + config.formatDate(HQ.rawDate);
      lastRecord = 'Retired by ' + reason.officer.name() + ' in ' + reason.name + ', ' + config.formatDate(HQ.rawDate);
      reason.officer.history.push(success)
      reason.target.history.push(lastRecord)

      if (reason.byPlayer && !reason.officer.isPlayer) {
        HQ.findPlayer().history.push(success)
      }
    }
  }
}

export default Officer;
