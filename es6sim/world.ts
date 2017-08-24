
import config from './config';
import util from './util';
import Region from './region';

class World {
  regions;
  constructor (hq) {
    this.regions = [];
    this.generate(hq);
  }

  addRegion () {
    let regionId = this.regions.length;
    this.regions.push(new Region(regionId))
  }

  generate (hq) {
    let amount = util.random(10) + 5;
    for (var i = 0; i < amount; i++) {
      this.addRegion();
    }
    this.mapUnitsAndRegions(hq);
  }

  mapUnitsAndRegions (hq) {
    let unitsPerRegion = Math.ceil(hq.units.length / this.regions.length) + 1;
    let unitIndex = 0;

    this.regions.map((region) => {
      let count = 0;

      while (count < unitsPerRegion) {
        const unit = hq.units[unitIndex];

        if (unit) {
          region.units.push(unit);
          unit.regionId = region.id;
          unitIndex++;
          count++;
        } else {
          return;
        }
      }
    })

    console.log(hq.units)
  }
}

export default World
