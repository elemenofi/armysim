'use strict';
import Officer from './officer';

class Officers {
  constructor () {
    this.staff = [];
    this.retired = [];
  }

  recruit (rank, unitId) {
    let recruit = new Officer(rank, unitId);

    this.staff.push(recruit);

    return recruit;
  }

  retire () {
    this.retired = this.retired.concat(
      this.staff.filter(officer => {
        return officer.retired;
      })
    );
  }

  update () {
    this.staff.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;
