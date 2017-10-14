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
  superior: Officer
  competitor: Officer
  timeLeftInRank: number
  isMilitant: boolean
  isRetired: boolean
  isSenior: boolean

  constructor (rank: number) {
    this.rank = new Rank(rank)
    this.experience = 100 * rank + util.random(100)
  }

  tick () {
    this.experience++
    this.timeLeftInRank = this.rank.max - this.experience
    this.isRetired = this.experience > this.rank.max

    if (!this.unit.parent) return
    const parent = this.unit.parent
    this.superior = parent.officer
    this.competitor = this.unit.sister.officer
    this.isMilitant = this.timeLeftInRank < this.superior.timeLeftInRank
    this.isSenior = this.experience > this.competitor.experience
  }
}

export class Unit {
  id: number
  name: string
  tier: number
  officer: Officer
  parent: Unit
  sister: Unit
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

  addSisters () {
    this.oob.forEach((unit) => {
      if (unit.parent) {
        unit.sister = unit.parent.subunits.find((u) => {
          return u.id !== unit.id
        })
      }
    })
  }
}

export class Army extends Unit {
  hq: Headquarter = new Headquarter()

  constructor () {
    super(9)

    this.assignIds(this)
    this.assignRelations(this)

    this.generateUnitsTree(8, 2, this)

    this.hq.addSisters()

    this.hq.addOfficer(this.officer)
  }

  // creates a binary tree of units whth
  // officer, subunit and parent
  // also pushes them to the HQ
  private generateUnitsTree (tier: number, quantity: number, parent: Unit) {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = new Unit(tier)

      this.assignIds(unit)
      this.assignRelations(unit, parent)

      this.generateUnitsTree(tier - 1, 2, unit)
      this.generateUnitsTree(tier, quantity - 1, parent)

      this.hq.addUnit(unit)
      this.hq.addOfficer(unit.officer)
    }
  }

  private assignIds (unit: Unit) {
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
