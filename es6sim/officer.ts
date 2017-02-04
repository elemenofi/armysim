/* global Chance */
'use strict';
import config from './config';
import Traits from './traits';
import Army from './typings';
import * as chance from './lib/chance';

interface Chance {
  last(): string;
  first(o: Army.FirstNameSpec): string
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

  constructor (spec: Army.OfficerSpec, HQ: any, unitName: string) {
    let traits = new Traits();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.reserved = false;

    this.rank = config.ranks[spec.rankName];
    this.experience = config.ranks[spec.rankName].startxp + config.random(500);
    this.prestige = config.ranks[spec.rankName].startpr + config.random(10);

    this.traits = { base: traits.random() };
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);

    this.alignment = config.random(1000);
    this.militancy = (this.isPlayer) ? 0 : config.random(10);
    this.drift = 0;

    this.operations = [];
    this.history = [];

    this.chance = chance(Math.random);
    this.lname = this.chance.last();
    this.fname = this.chance.first({gender: 'male'});

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
    this.drifts(HQ);
    this.militate(HQ);
    this.experience++;
    this.prestige += config.random(config.ranks[this.rank.alias].startpr);
    if (!this.reserved && this.experience > this.rank.maxxp) this.reserve(HQ);
  }

  drifts (HQ: Army.HQ) {
    let unit = HQ.findUnitById(this.unitId);
    let parent = HQ.findUnitById(unit.id);
    this.commander = parent.commander;
  }

  align () {
    if (this.drift > 0 && this.alignment < 1000) {
      this.alignment += this.drift;
    } else if (this.drift < 0 && this.alignment > 0) {
      this.alignment += this.drift;
    }
  }

  militate (HQ: any) {
    if (this.militancy > 0 && !this.reserved) {
      let spec = {
        officer: this,
        target: HQ.findCommandingOfficer(this),
        type: this.traits.base.area,
        name: 'Operation ' + this.lname,
      };

      // cant target same officer with two operations
      let existed = this.operations.filter(operation => {
        if (operation.target.id === spec.target.id) {
          return true;
        }
      });

      if (spec.target && !existed.length) {
        HQ.operations.add(spec);
        this.militancy--;
      }
    }
  }

  reserve (HQ, reason?: Army.Operation) {
    var lastUnit = HQ.units.filter(unit => {
      return unit.id === this.unitId;
    })[0];

    if (this.rank.hierarchy >= 4) lastUnit.reserve.push(this);
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();

    this.reserved = true;

    this.history.push('Moved to reserve on ' + HQ.realDate);

    if (reason) {
      this.reason = reason;

      this.history[this.history.length - 1] = this.history[this.history.length - 1] + ' after succesful operation by ' + reason.officer.name();
      reason.officer.history.push('Moved ' + reason.target.name() + ' to reserve on ' + HQ.realDate + ' after succesful ' + reason.type + ' operation')

      if (reason.byPlayer && !reason.officer.isPlayer) {
        HQ.findPlayer().history.push('Moved ' + reason.target.name() + ' to reserve with ' + reason.officer.name())
      }
    }
  }
}

export default Officer;
