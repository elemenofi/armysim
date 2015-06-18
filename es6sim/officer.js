'use strict';
import config from './config';
import Promoter from './promoter';
import {} from './chance';

const promoter = new Promoter();

class Officer {
  constructor() {
    this.experience = config.experience();
    this.rank = promoter.ranks.lieutenant;
    this.fname = chance.name({ gender: 'male' });
    this.lname = chance.last();
  }

  name() {
    return this.rank.title + ' ' + this.fname + ' ' + this.lname;
  } 

  update() {
    this.experience++;
    this.checkPromotion();
  }

  checkPromotion() {
    let nextRank = {};
    
    if (this.experience > promoter.thresholds.major) {
      nextRank = promoter.ranks.major;
    } else if (this.experience > promoter.thresholds.captain) {
      nextRank = promoter.ranks.captain;
    } else {
      nextRank = promoter.ranks.lieutenant;
    }

    if (
      nextRank !== {} && 
      nextRank !== this.rank
    ) {
      console.log('Promoting ' + this.name() + ' to ' + nextRank.title);
      this.rank = promoter.promote(nextRank.alias);
    } else {
      console.log('Passed for promotion.');
    }
  } 
}

export default Officer;