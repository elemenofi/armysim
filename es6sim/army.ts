
import config from './config'
import hq from './hq'
import Unit from './unit'

interface Window { army: any }

class Army {
  hq: hq
  _unitsId: number
  units: any
  command: Unit

  constructor () {
    this.hq = new hq()

    this._unitsId = 0

    const spec = {
      id: this._unitsId,
      type: 'army',
      parentId: undefined,
      rank: undefined,
    }

    spec.parentId = undefined
    spec.rank = 'general'
    let unit: Unit = {} as any
    unit = new Unit(spec, this.hq)

    unit.subunits = []

    this.command = unit
    this.hq.units.push(unit)

    this._unitsId++

    this.generate('corp', config.unitDepth)

    this.hq.units.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0) )
  }

  generate (type, quantity, parent?) {
    if (quantity === 0) {
      return
    } else {
      const spec = {
        id: this._unitsId,
        type,
        parentId: undefined,
        rank: undefined,
      }

      let unit: Unit = {} as any
      this._unitsId++
      spec.parentId = parent ? parent.id : 0

      switch (type) {
        case 'corp':
          spec.rank = 'lgeneral'
          unit = new Unit(spec, this.hq)
          this.command.subunits.push(unit)

          this.generate('division', config.unitDepth, unit)
          this.generate('corp', quantity - 1, parent)
        break

        case 'division':
          spec.rank = 'dgeneral'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('brigade', config.unitDepth, unit)
          this.generate('division', quantity - 1, parent)
        break

        case 'brigade':
          spec.rank = 'bgeneral'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('regiment', config.unitDepth, unit)
          this.generate('brigade', quantity - 1, parent)
        break

        case 'regiment':
          spec.rank = 'coronel'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('battalion', config.unitDepth, unit)
          this.generate('regiment', quantity - 1, parent)
        break

        case 'battalion':
          spec.rank = 'lcoronel'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('company', config.unitDepth, unit)
          this.generate('battalion', quantity - 1, parent)
        break

        case 'company':
          spec.rank = 'major'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('platoon', config.unitDepth, unit)
          this.generate('company', quantity - 1, parent)
        break

        case 'platoon':
          spec.rank = 'captain'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('squad', config.unitDepth, unit)
          this.generate('platoon', quantity - 1, parent)
        break

        case 'squad':
          spec.rank = 'lieutenant'
          unit = new Unit(spec, this.hq)
          parent.subunits.push(unit)

          this.generate('squad', quantity - 1, parent)
        break
      }

      this.hq.units.push(unit)

    }
  }
}

export default Army
