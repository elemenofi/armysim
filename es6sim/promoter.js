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

    if (officer.experience > this.thresholds.major) {
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