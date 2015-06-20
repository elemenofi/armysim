'use strict';
class Promoter {
  constructor() {
    this.thresholds = {
      captain: 20,
      major: 40
    };

    this.ranks = {
      lieutenant: {
        title: 'Lieutenant',
        alias: 'lieutenant'
      },
      captain: {
        title: 'Captain',
        alias: 'captain'
      },
      major: {
        title: 'Major',
        alias: 'major'
      }
    };
  }

  checkPromotion (officer) {
    let nextRank = {};
    
    if (officer.experience > this.thresholds.major) {
      nextRank = this.ranks.major;
    } else if (officer.experience > this.thresholds.captain) {
      nextRank = this.ranks.captain;
    } else {
      nextRank = this.ranks.lieutenant;
    }

    if (nextRank !== {} && nextRank !== officer.rank) {
      officer.rank = this.promote(nextRank.alias);
    } else {
      console.log('Passed for promotion.');
    }
  } 
  
  promote (nextRank) {
    return this.ranks[nextRank];
  }
}
export default Promoter;