import { Subject } from 'rxjs/Subject'
import { UI } from '../ui/ui'
import { Logger } from './logger'
import { Officer } from './officer'
import { Operation } from './operation'
import { Rank } from './rank'
import { Staff } from './staff'
import { Unit } from './unit'

export interface OrderOption {
  text: string
  handler: () => void
}

export class Order {
  options: OrderOption[]
  title: string
  description: string
  data$: Subject<any>
  value: string

  constructor (title, description, options, data$, value?) {
    this.title = title
    this.data$ = data$
    this.description = description
    this.options = options
    this.value = value
  }
}

export class Headquarter {
  UNITID = 0
  army: Unit
  oob: Unit[] = []
  staff: Staff
  inspected: Officer
  log: Logger
  order: Order
  player: Officer

  readonly LEVELS_BELOW_DIVISION = 1

  constructor () {
    this.log = new Logger()
    this.staff = new Staff(this)
    this.army = this.build(9)

    const officer = this.staff.recruit(9)
    this.player = officer

    this.inspect(officer)

    this.staff.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)

    this.staff.assignPlayer(officer)
  }

  tick (): void {
    this.staff.active.forEach((officer) => {
      if (officer.shouldRetire()) {
        this.staff.retire(officer)
      } else {
        officer.tick()
      }
    })
    this.staff.setScores()
  }

  inspect (officer: Officer): void {
    this.inspected = officer
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
