
import config from './config'
import Region from './region'
import util from './util'

class World {
  regions
  constructor (hq) {
    this.regions = []
    this.generate(hq)
  }

  addRegion () {
    const regionId = this.regions.length
    this.regions.push(new Region(regionId))
  }

  generate (hq) {
    const amount = util.random(10) + 5
    for (let i = 0; i < amount; i++) {
      this.addRegion()
    }
    this.mapUnitsAndRegions(hq)
  }

  mapUnitsAndRegions (hq) {
    const unitsPerRegion = Math.ceil(hq.units.length / this.regions.length) + 1
    let unitIndex = 0

    this.regions.map((region) => {
      let count = 0

      while (count < unitsPerRegion) {
        const unit = hq.units[unitIndex]

        if (unit) {
          region.units.push(unit)
          unit.regionId = region.id
          unitIndex++
          count++
        } else {
          return
        }
      }
    })
  }
}

export default World
