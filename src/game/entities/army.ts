import * as chance from 'chance'
import * as moment from 'moment'
import { Keyboard } from '../keyboard'
import { Logger } from '../logger'
import { UI } from '../ui/ui'
import { names, util } from '../util'
import { Officer } from './officer'
import { Operation } from './operation'
import { Rank } from './rank'
import { Staff } from './staff'
import { Unit } from './unit'

export class Headquarter {
  UNITID = 0
  army: Unit
  oob: Unit[] = []
  staff: Staff
  inspected: Officer
  log: Logger

  constructor () {
    this.log = new Logger()
    this.staff = new Staff(this)
    this.army = this.build(9)

    const officer = this.staff.recruit(9)

    this.staff.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)
  }

  tick (turn: number): void {
    this.staff.active.forEach((officer) => {
      if (officer.isRetired() || officer.forcedToRetireBy) {
        this.staff.retire(officer)
      } else {
        officer.tick()
      }
    })
  }

  private build (tier: number): Unit {
    const unit = new Unit(tier)

    unit.id = this.UNITID
    this.UNITID++

    if (tier < 9) this.oob.push(unit)

    return unit
  }

  private assignParent (unit: Unit, parent: Unit): Unit {
    unit.parent = parent

    parent.subunits.push(unit)

    return unit
  }

  private assignSister (unit: Unit): Unit {
    unit.sister = unit.parent.subunits.find((u) => {
      return u.id !== unit.id
    })

    return unit
  }

  private generateUnitsTree (tier: number, quantity: number, parent: Unit): void {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = this.build(tier)
      const officer = this.staff.recruit(tier)

      this.staff.assign(officer, unit)

      this.assignParent(unit, parent)

      this.generateUnitsTree(tier - 1, 2, unit)
      this.generateUnitsTree(tier, quantity - 1, parent)

      this.assignSister(unit)
    }
  }
}
