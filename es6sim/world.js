'use strict';
import config from './config';
import Region from './region';

class World {
  constructor (HQ) {
    this.regions = [];
    this.generate(HQ);
  }

  addRegion () {
    let regionId = this.regions.length;
    this.regions.push(new Region(regionId));
  }

  generate (HQ) {
    let amount = config.random(10) + 5;
    for (var i = 0; i < amount; i++) {
      this.addRegion();
    }
    this.mapUnitsAndRegions(HQ);
  }

  mapUnitsAndRegions (HQ) {
    let unitsPerRegion = Math.ceil(HQ.units.length / this.regions.length) + 1;
    let unitIndex = 0;

    this.regions.map(region => {
      let count = 0;
      
      while (count < unitsPerRegion) {
        let unit = HQ.units[unitIndex];
      
        if (unit) {
          region.units.push(unit);
          unit.regionId = region.id;
          unitIndex++;
          count++;
        } else {
          return;
        }
      }
    });
  } 
}

export default World;