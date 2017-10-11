
export class Operation {
  id: number
  name: string
  officer: Officer
  target: Officer
  strength: number
  status: string
}

export class Officer {
  id: number
  name: string
  experience = 0
  rank: number
  unit: Unit
  operation: Operation
  status: string

  constructor (rank: number) {
    this.rank = rank
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
    this.staff.forEach((officer) => officer.experience++)
  }
}

export class Army extends Unit {
  hq: Headquarter = new Headquarter()

  constructor () {
    super(9)
    this.officer = new Officer(9)
    this.assign(this)
    this.generate(8, 2, this)
  }

  generate (tier: number, quantity: number, parent: Unit) {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = new Unit(tier)
      this.assign(unit, parent)
      this.generate(tier - 1, 2, unit)
      this.generate(tier, quantity - 1, parent)
      this.hq.oob.push(unit)
    }
  }

  assign (unit: Unit, parent?: Unit) {
    if (parent) unit.parent = parent
    unit.id = this.hq.UNITID
    unit.officer.id = this.hq.OFFICERID
    unit.officer.unit = unit

    this.hq.staff.push(unit.officer)
    if (parent) parent.subunits.push(unit)

    this.hq.UNITID++
    this.hq.OFFICERID++
  }
}

export class Game {
  army = new Army()
  turn = 0
  status = 'playing'

  constructor () {
    this.tick()
  }

  tick () {
    if (this.status === 'paused') return

    this.turn++
    this.army.hq.tick()

    setTimeout(() => this.tick(), 2)
  }
}
