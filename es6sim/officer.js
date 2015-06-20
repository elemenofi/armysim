'use strict';
/* global chance */
import {} from './chance';
import config from './config';
import Promoter from './promoter';

const promoter = new Promoter();

class Officer {
  constructor (experience, unitId) {
    this.experience = config.experience(experience);
    this.unitId = unitId;
    this.fname = chance.name({ gender: 'male' });
    this.lname = chance.last();
    this.retired = false;
  }

  name () {
    return this.rank.title + ' ' + this.fname + ' ' + this.lname;
  } 

  update () {
    this.experience++;
    promoter.checkPromotion(this);
  }

  promote (nextRank) {
    this.rank = nextRank;
  }

  retire () {
    this.retired = true;
  }
}

export default Officer;