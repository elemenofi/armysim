'use strict';
import Officer from './officer';

class Officers {
  constructor(size) {
    this.staff = [];
    this.recruit(size);
  }

  recruit(amount) {
    let newOfficer = () => {
      let officer = new Officer();
      this.staff.push(officer);
      amount--;
      this.recruit(amount);
    };
    
    if (amount) {
      newOfficer();
    }
  }

  update() {
    this.staff.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;