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

    this.alignment = config.random(1000); // 0 1000
    this.militancy = config.random(10); // 1 a 10
    this.drift = 0; //1 a 10

    this.administration = this.traits.base.administration + config.random(10);
    this.intelligence = this.traits.base.intelligence + config.random(10);
    this.commanding = this.traits.base.commanding + config.random(10);
    this.diplomacy = this.traits.base.diplomacy + config.random(10);

    this.lname = chance.last();
    this.fname = chance.name({gender: 'male'});
    
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

  update () {
    this.experience++;
    if (this.experience > this.rank.maxxp) this.retire();

  }

  driftAlign (officers, units) {
    this.unit = units.filter(unit => {
      return unit.id === this.unitId;
    })[0];

    this.commander = officers.filter(officer => {
      return officer.unitId === this.unit.parentId;
    })[0];
    
    if (this.commander.alignment > 500) {
      this.drift++;
    } else {
      this.drift--;
    }

    if (this.drift > 0 && this.alignment < 1000) {
      this.alignment += this.drift;
    } else if (this.drift < 0 && this.alignment > 0) {
      this.alignment -= this.drift;
    }
  }

  retire () {
    this.retired = true;
  }
}

export default Officer;