/* global Chance */
'use strict';
import {} from './lib/chance';
import config from './config';
import Traits from './traits';
import Army from './typings';

let Chance: Chance;

interface Chance {
  new(): Chance;
  lname(): string;
  first(n: Army.FirstNameSpec): string;
  last(): string
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

  constructor (spec: Army.OfficerSpec, HQ: any, unitName: string) {
    let chance = new Chance() as Chance;
    let traits = new Traits();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;

    this.rank = config.ranks[spec.rankName];
    this.experience = config.ranks[spec.rankName].startxp + config.random(500);
    this.prestige = config.ranks[spec.rankName].startpr + config.random(10);

    this.traits = { base: traits.random() };
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);

    this.alignment = config.random(1000);
    this.militancy = config.random(10);
    this.drift = 0;

    this.operations = [];
    this.history = [];
    this.reserved = false;
    this.lname = chance.last();
    this.fname = chance.first({gender: 'male'});

    if (this.isPlayer) {
      this.lname = (config.debug) ? 'Richardson' : prompt('Name?');
      this.fname = 'John';
      this.experience = 0;
    }

    this.graduate({
      date: config.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName)
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
    this.align();
    this.militate(HQ);
    this.experience++;
    this.prestige += config.random(config.ranks[this.rank.alias].startpr);
    // if (this.isPlayer) {
    //     console.log(this.experience, this.rank.maxxp)
    // }
    if (!this.reserved && this.experience > this.rank.maxxp) this.reserve(HQ);
  }

  drifts (officers: any, units: any) {
    this.unit = units.filter(unit => {
      return unit.id === this.unitId;
    })[0];

    this.commander = officers.filter(officer => {
      return officer.unitId === this.unit.parentId;
    })[0];

    if (this.commander && this.commander.alignment > 500) {
      this.drift++;
    } else {
      this.drift--;
    }
  }

  align () {
    if (this.drift > 0 && this.alignment < 1000) {
      this.alignment += this.drift;
    } else if (this.drift < 0 && this.alignment > 0) {
      this.alignment += this.drift;
    }
  }

  militate (HQ: any) {
    if (this.militancy > 8 && HQ.findCommandingOfficer(this).militancy < 2) {
      let spec = {
        officer: this,
        target: HQ.findCommandingOfficer(this),
        type: this.traits.base.area,
        name: 'Operation ' + this.lname,
      };
      if (spec.target) HQ.operations.add(spec)
    }
  }

  reserve (HQ, reason?) {
    var lastUnit = HQ.units.filter(unit => {
      return unit.id === this.unitId;
    })[0];

    if (this.rank.hierarchy >= 4) lastUnit.reserve.push(this);
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();

    this.reserved = true;

    this.history.push('Moved to reserve on ' + HQ.realDate);
    if (reason) {
      this.history[this.history.length - 1] = this.history[this.history.length - 1] + ' after succesful operation by ' + reason.officer.name();
      reason.officer.history.push('Moved ' + reason.target.name() + ' to reserve on ' + HQ.realDate + ' after succesful ' + reason.type + ' operation')
    }

    // if (this.isPlayer || reason) console.log(this.history[this.history.length - 1]);
  }
}

export default Officer;
