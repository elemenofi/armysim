'use strict';
// import {} from './lib/chance';
// let chance = new Chance();
import Army from './typings'

class Region {
  id: number;
  name: string;
  units: Army.Unit[]
  constructor (id) {
    this.id = id;
    this.name = 'lalslslsl';
    // this.name = chance.city();
    this.units = [];
  }
}

export default Region;
