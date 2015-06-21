'use strict';
import Officer from './officer';

class Officers {
  constructor () {
    this.active = [];
    this.retired = [];
  }

  recruit (rank, unitId) {
    let recruit = new Officer(rank, unitId);

    this.active.push(recruit);

    return recruit;
  }

  retire () {
    this.retired = this.retired.concat(
      this.active.filter(officer => {
        return officer.retired;
      })
    );
  }

  update () {
    this.active.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;
