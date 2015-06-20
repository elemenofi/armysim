'use strict';
import Officer from './officer';

class Officers {
  constructor(size) {
    this.staff = [];
    this.recruit(size);
  }

  recruit(amount) {
    while (this.staff.length < amount) {
      this.staff.push(new Officer());
    }
  }

  update() {
    this.staff.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;