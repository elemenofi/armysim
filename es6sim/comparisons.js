'use strict';
class Comparisons {
  byExperience (a, b) {
    if (a.experience > b.experience) {
      return -1;
    } else if (a.experience < b.experience) {
      return 1;
    }
    return 0;
  }
}

export default Comparisons;
