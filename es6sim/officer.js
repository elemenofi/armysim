'use strict';
import {} from './chance';
import config from './config';
import Traits from './traits';

class Officer {
  constructor (spec) {
    let chance = new Chance();
    let traits = new Traits();

    this.id = spec.id;

    this.unitId = spec.unitId;
    this.rank = config.ranks[spec.rank];
    this.experience = config.ranks[spec.rank].startxp + config.random(10);
    
    this.traits = {
      base: traits.random()
    };

    this.alignment = config.random(1000);
    this.militancy = config.random(10);
    this.drift = 0;
    this.operations = [];

    this.administration = this.traits.base.administration + config.random(10);
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);

    this.lname = chance.last();
    this.fname = chance.first({gender: 'male'});
    
    let graduation = {
      unit: spec.unitName,
      date: spec.date
    };

    this.history = [];
    this.history.push(config.graduated(graduation, this));
  }

  name () {
    return this.rank.title + ' ' + this.fname + ' ' + this.lname;
  } 

  update (HQ) {
    this.align();
    this.militate(HQ);
    this.experience++;
    if (this.experience > this.rank.maxxp) this.retire();
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
    if (
      (this.drift > 0 && this.alignment > 900) || 
      (this.drift < 0 && this.alignment < 100)
    ) {
      if (this.militancy < 10) this.militancy++;
    }
    if (this.militancy === 10) {
      this.operations.push(HQ.operations.add(this, HQ));
      this.militancy = 0;
    }
  }

  retire () {
    this.retired = true;
  }
}

export default Officer;