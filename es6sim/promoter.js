'use strict';
import config from './config';

class Promoter {
  constructor() {
    this.ranks = config.ranks;
    this.thresholds = config.thresholds;
  } 
  
  checkPromotion (officer) {
    let nextRank = {};
    
    if (officer.experience > this.thresholds.retirement ) {
      officer.retire();
    }

    if (officer.experience > this.thresholds.general) {
      nextRank = this.ranks.general;
    } else if (officer.experience > this.thresholds.lgeneral) {
      nextRank = this.ranks.lgeneral;
    } else if (officer.experience > this.thresholds.dgeneral) {
      nextRank = this.ranks.dgeneral;
    } else if (officer.experience > this.thresholds.bgeneral) {
      nextRank = this.ranks.bgeneral;
    } else if (officer.experience > this.thresholds.coronel) {
      nextRank = this.ranks.coronel;
    } else if (officer.experience > this.thresholds.lcoronel) {
      nextRank = this.ranks.lcoronel;
    } else if (officer.experience > this.thresholds.major) {
      nextRank = this.ranks.major;
    } else if (officer.experience > this.thresholds.captain) {
      nextRank = this.ranks.captain;
    } else {
      nextRank = this.ranks.lieutenant;
    }


    if (nextRank !== {} && nextRank !== officer.rank) {
      officer.promote(nextRank);
    }

  }
}

export default Promoter;