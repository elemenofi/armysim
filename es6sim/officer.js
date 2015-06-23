'use strict';
/* global chance */
import {} from './chance';
import config from './config';
import Traits from './traits';

let traits = new Traits();

class Officer {
  constructor (spec) {
    this.unitId = spec.unitId;
    this.rank = config.ranks[spec.rank];
    this.lname = chance.last();
    this.fname = chance.name({ gender: 'male' });
    this.experience = config.ranks[spec.rank].startxp + config.experience();
    this.history = [];
    this.trait = traits.random();

    let graduation = {
      unit: spec.unitName,
      date: spec.date
    };

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