/* global Chance */
'use strict';
import {} from './chance';
import config from './config';
import Traits from './traits';

class Officer {
  constructor (spec, HQ, unitName) {
    let chance = new Chance();
    let traits = new Traits();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.rank = config.ranks[spec.rank];
    this.experience = config.ranks[spec.rank].startxp + config.random(10);
    this.prestige = config.ranks[spec.rank].startpr + config.random(10);
    this.traits = { base: traits.random() };
    this.alignment = config.random(1000);
    this.militancy = config.random(10);
    this.drift = 0;
    this.operations = [];
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);
    if (this.isPlayer) {
      this.lname = 'Richardson';
      this.fname = 'John';
      this.experience = 0;
    } else {
      this.lname = chance.last();
      this.fname = chance.first({gender: 'male'});
    }
    this.history = [];
    this.graduate({
      date: config.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName)
    });
  }

  name () {
    return this.rank.title + ' ' + this.fname + ' ' + this.lname;
  }

  graduate (spec) {
    let graduation = { unit: spec.unitName, date: spec.date };
    this.history.push(config.graduated(graduation, this));
  }

  update (HQ) {
    this.align();
    this.militate(HQ);
    this.experience++;
    this.prestige += config.random(config.ranks[this.rank.alias].startpr);
    if (this.experience > this.rank.maxxp) this.reserve(HQ);
  }

  drifts (officers, units) {
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

  militate (HQ) {
    if ((this.drift > 0 && this.alignment > 900) ||
      (this.drift < 0 && this.alignment < 100)) {
      if (this.militancy < 10) this.militancy++;
    }
    if (this.militancy === 10 && !this.isPlayer) {
      this.operations.push(HQ.operations.add(this, HQ));
      this.militancy = 0;
    }
  }

  reserve (HQ) {
    var lastUnit = HQ.units.filter(unit => {
      return unit.id === this.unitId;
    })[0];
    lastUnit.reserve.push(this);
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();
    this.reserved = true;
    this.history.push('Moved to reserve on ' + HQ.realDate);
  }
}

export default Officer;
