'use strict';
import Officer from './officer';

class Officers {
  constructor () {
    this.staff = [];
  }

  recruit (experience, unitId) {
    let recruit = new Officer(experience, unitId);
    
    this.staff.push(recruit);
    
    return recruit;
  }

  retire () {
    this.staff = this.staff.filter(officer => { 
      return !officer.retired; 
    });
  }

  update () {
    this.staff.forEach(officer => {
      officer.update();
    });
    console.log(this.staff.length);
  }
}

export default Officers;