'use strict';
/* global chance */
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
    promoter.checkPromotion(this);
  } 
}

export default Officer;