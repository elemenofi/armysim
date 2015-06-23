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


    this.alignment = 0;
    this.militancy = config.random(10);
    this.drift = config.random(10);

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

  update (actives, units) {
    this.experience++;
    if (this.experience > this.rank.maxxp) this.retire();

    debugger;
    let mine = units.filter(unit => {
      return unit.id === this.unitId;
    })[0];
    
    let mineCommander = actives.filter(active => {
      return active.unitId === mine.parentId;
    });
  }

  retire () {
    this.retired = true;
  }
}

export default Officer;