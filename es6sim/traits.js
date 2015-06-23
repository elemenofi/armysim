'use strict';

class Traits {
  constructor() {
    this.base = [
      {
        name: 'Diplomat',
        area: 'diplomacy',
        school: 'National Officer Candidate School'
      },
      {
        name: 'Warrior',
        area: 'commanding',
        school: 'Army Cadet Academy'
      },
      {
        name: 'Spy',
        area: 'intelligence',
        school: 'Institute of Military Intelligence'
      },
      {
        name: 'Administrator',
        area: 'administration',
        school: 'General Sutton University'
      }
    ];
  }

  random () {
    let rnd = Math.round(Math.random() * 3);
    return this.base[rnd];
  }
}

export default Traits;