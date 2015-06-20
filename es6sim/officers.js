'use strict';
import Officer from './officer';

class Officers {
  constructor () {
    this.staff = [];
  }

  recruit (rank, unitId) {
    let recruit = new Officer(rank, unitId);

    this.staff.push(recruit);

    return recruit;
  }

  retire () {
    this.staff = this.staff.filter(officer => {
      return !officer.retired;
    });
  }

  // this function creates an array with those commanders which
  // have been selected for promotion
  candidate () {
    this.staff = this.staff.filter(officer => {
      return officer.promotable;
    });
  }

  update () {
    this.staff.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;
