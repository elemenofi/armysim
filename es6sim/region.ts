'use strict';
// import {} from './lib/chance';
// let chance = new Chance();
import * as chance from './lib/chance';

interface Chance {
  last(): string;
  first(o: Army.FirstNameSpec): string
  city(): string;
}

import Army from './typings'

class Region {
  id: number;
  name: string;
  units: Army.Unit[];
  chance: Chance;
  constructor (id) {
    this.chance = chance(Math.random);
    this.id = id;
    this.chance = chance(Math.random)
    this.name = this.chance.city();
    this.units = [];
  }
}

export default Region;
