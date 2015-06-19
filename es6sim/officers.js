'use strict';
import config from './config';
import Officer from './officer';

class Officers {
  constructor () {
    this.staff = [];
    while (this.staff.length < config.staffSize) {
      this.staff.push(new Officer());
    }
  }

  recruit () {
    this.staff.push(new Officer());
  }

  retire () {
    this.staff = this.staff.filter(officer => { 
      return !officer.retired; 
    });
  }

  replenish () {
    while (this.staff.length < config.staffSize) {
      this.staff.push(new Officer());
    }
  }

  update () {
    this.staff.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;