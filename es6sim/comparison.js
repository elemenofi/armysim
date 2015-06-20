'use strict';
class Comparisons {
  byRank (a, b) {
    if (a.rank.hierarchy > b.rank.hierarchy) {
      return -1;
    } else if (a.rank.hierarchy < b.rank.hierarchy) {
      return 1;
    }
    return 0;
  }
}

export default Comparisons;