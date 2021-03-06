import { Logger } from './logger'
import { Officer } from './officer'
import { Staff } from './staff'
import { Unit } from './unit'

export class Headquarter {
  UNITID = 0
  army: Unit
  oob: Unit[] = []
  staff: Staff
  log: Logger
  player: Officer
  turn = 0

  readonly LEVELS_BELOW_DIVISION = 1

  constructor () {
    this.log = new Logger(this)
    this.staff = new Staff(this)
    this.army = this.build(9)

    const officer = this.staff.recruit(9)

    this.staff.inspect(officer)

    this.staff.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)
  }

  tick (): void {
    this.turn++

    this.staff.active.forEach((officer) => { officer.tick() })
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
    if (quantity === 0 || tier < this.LEVELS_BELOW_DIVISION) {
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
