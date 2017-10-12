import util from '../util'

export class Operation {
  id: number
  name: string
  officer: Officer
  target: Officer
  strength: number
  status: string
}

export class Rank {
  tier: number
  max: number

  constructor (tier: number) {
    this.tier = tier
    this.max = tier * 100 * 2
  }
}

export class Officer {
  id: number
  name: string
  experience: number
  rank: Rank
  unit: Unit
  operation: Operation
  status: string
  timeLeftInRank: number
  militant: boolean
  retired: boolean
  senior: boolean

  constructor (rank: number) {
    this.rank = new Rank(rank)
    this.experience = 100 * rank + util.random(100)
  }

  tick () {
    this.experience++
    this.timeLeftInRank = this.rank.max - this.experience
    this.retired = this.experience > this.rank.max
    this.updateAtitude()
  }

  private updateAtitude () {
    if (!this.unit.parent) return
    this.militant =  this.timeLeftInRank < this.unit.parent.officer.timeLeftInRank
    this.senior = this.experience > this.competingOfficer().experience
  }

  private competingOfficer (): Officer {
    const subunits = this.unit.parent.subunits
    return subunits.filter((unit) => unit.id !== this.unit.id)[0].officer
  }
}

export class Unit {
  id: number
  name: string
  tier: number
  officer: Officer
  parent: Unit
  subunits: Unit[] = []

  constructor (tier: number) {
    this.tier = tier
    this.officer = new Officer(tier)
  }
}

export class Headquarter {
  UNITID = 0
  OFFICERID = 0
  OPERATIONID = 0
  oob: Unit[] = []
  staff: Officer[] = []

  tick () {
    this.staff.forEach((officer) => officer.tick())
  }

  addUnit (unit: Unit) {
    this.oob.push(unit)
  }

  addOfficer (officer: Officer) {
    this.staff.push(officer)
  }
}

export class Army extends Unit {
  hq: Headquarter = new Headquarter()

  constructor () {
    super(9)
    this.officer = new Officer(9)
    this.assignIds(this)
    this.assignRelations(this)
    this.hq.addOfficer(this.officer)
    this.generateUnitsTree(8, 2, this)
  }

  // creates a binary tree of units whth
  // officer, subunit and parent
  // also pushes them to the HQ
  private generateUnitsTree (tier: number, quantity: number, parent: Unit) {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = new Unit(tier)

      this.assignIds(unit, parent)
      this.assignRelations(unit, parent)

      this.generateUnitsTree(tier - 1, 2, unit)
      this.generateUnitsTree(tier, quantity - 1, parent)

      this.hq.addUnit(unit)
      this.hq.addOfficer(unit.officer)
    }
  }

  private assignIds (unit: Unit, parent?: Unit) {
    unit.id = this.hq.UNITID
    unit.officer.id = this.hq.OFFICERID
    this.hq.UNITID++
    this.hq.OFFICERID++
  }

  private assignRelations (unit: Unit, parent?: Unit) {
    unit.officer.unit = unit

    if (parent) unit.parent = parent
    if (parent) parent.subunits.push(unit)
  }
}

export class Game {
  army = new Army()
  turn = 0
  status = 'playing'

  constructor () {
    this.tick()
  }

  private tick () {
    if (this.status === 'paused') return

    if (this.turn >= 500) debugger

    this.turn++
    this.army.hq.tick()

    setTimeout(() => this.tick(), 2)
  }
}
