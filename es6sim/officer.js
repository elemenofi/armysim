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
    this.experience = config.experience() + config.ranks[rank].startxp;
  }

  name () {
    return this.rank.title + ' ' + this.fname + ' ' + this.lname;
  } 

  update () {
    this.experience++;
  }

  promotable () {
    this.promotable = true;
  }

  promote (nextRank) {
    this.nextRank = nextRank;
  }

  retire () {
    this.retired = true;
  }
}

export default Officer;