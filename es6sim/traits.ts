
export interface Trait {
  name: string;
  area: string;
  school: string;
  intelligence: number;
  commanding: number;
  diplomacy: number;
}

export class Traits {
  base: Trait[]
  constructor() {
    this.base = [
      {
        name: 'Diplomat',
        area: 'diplomacy',
        school: 'the National Officer Candidate School',
        intelligence: 3,
        commanding: 2,
        diplomacy: 4
      },
      {
        name: 'Warrior',
        area: 'commanding',
        school: 'the National Military Academy',
        intelligence: 2,
        commanding: 4,
        diplomacy: 1
      },
      {
        name: 'Spy',
        area: 'intelligence',
        school: 'the Institute of Military Intelligence',
        intelligence: 4,
        commanding: 1,
        diplomacy: 3
      }
    ];
  }

  random () {
    let rnd = Math.round(Math.random() * 2);
    return this.base[rnd];
  }
}

export default Traits;
