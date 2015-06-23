'use strict';

class Traits {
  constructor() {
    this.base = [
      {
        name: 'Diplomat',
        area: 'diplomacy',
        school: 'the National Officer Candidate School',
        administration: 1, 
        intelligence: 3,
        commanding: 2,
        diplomacy: 4
      },
      {
        name: 'Warrior',
        area: 'commanding',
        school: 'the National Military Academy',
        administration: 3, 
        intelligence: 2,
        commanding: 4,
        diplomacy: 1
      },
      {
        name: 'Spy',
        area: 'intelligence',
        school: 'the Institute of Military Intelligence',
        administration: 2, 
        intelligence: 4,
        commanding: 1,
        diplomacy: 3
      },
      {
        name: 'Administrator',
        area: 'administration',
        school: 'General Sutton University',
        administration: 4,
        intelligence: 1,
        commanding: 3,
        diplomacy: 2,
      }
    ];
  }

  random () {
    let rnd = Math.round(Math.random() * 3);
    return this.base[rnd];
  }
}

export default Traits;