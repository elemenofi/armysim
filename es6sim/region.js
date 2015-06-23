'use strict';
import {} from './chance';

let chance = new Chance();

class Region {
  constructor (id) {
    this.id = id;
    this.name = chance.city();
    this.units = [];
  }
}

export default Region;