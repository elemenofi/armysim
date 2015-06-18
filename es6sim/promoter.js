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
  
  promote(nextRank) {
    return this.ranks[nextRank];
  }
}
export default Promoter;