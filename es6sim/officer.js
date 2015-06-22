'use strict';
/* global chance */
import {} from './chance';
import config from './config';

class Officer {
  constructor (rank, unitId) {
    this.unitId = unitId;
    this.rank = config.ranks[rank];
    this.lname = chance.last();
    this.fname = chance.name({ gender: 'male' });
    this.experience = config.ranks[rank].startxp + config.experience();
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