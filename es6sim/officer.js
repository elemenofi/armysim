'use strict';
import {} from './chance';
import config from './config';
import Traits from './traits';

let chance = new Chance();
let traits = new Traits();

class Officer {
  constructor (spec) {
    this.unitId = spec.unitId;
    this.rank = config.ranks[spec.rank];
    this.experience = config.ranks[spec.rank].startxp + config.random(10);
    
    this.traits = {
      base: traits.random()
    };
    
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

  retire () {
    this.retired = true;
  }
}

export default Officer;