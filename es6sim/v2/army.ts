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
  events: string[]

  constructor (rank: number) {
    this.rank = new Rank(rank)
    this.experience = 100 * rank + util.random(100)
  }

  tick () {
    this.experience++
    this.timeLeftInRank = this.rank.max - this.experience
    this.isRetired = this.experience > this.rank.max

    if (!this.unit || !this.unit.parent) return
    const parent = this.unit.parent
    this.superior = parent.officer
    this.competitor = this.unit.sister.officer
    this.isMilitant = this.timeLeftInRank < this.superior.timeLeftInRank
    if (!this.competitor) return
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
    this.officer.unit = this
  }
}

export class Headquarter {
  UNITID = 0
  OFFICERID = 0
  OPERATIONID = 0
  army: Unit
  oob: Unit[] = []
  staff: Officer[] = []
  reserve: Officer[] = []

  constructor () {
    this.army = new Unit(9)
    this.assignIds(this.army)
    this.generateUnitsTree(8, 2, this.army)
    this.addSisters()
    this.staff.push(this.army.officer)
  }

  tick () {
    this.staff.forEach((officer) => {
      if (officer.isRetired) {
        this.retire(officer)
      } else {
        officer.tick()
      }
    })
  }

  private replace (officer: Officer) {
    let replacement: Officer

    if (officer.rank.tier === 1) {
      replacement = this.recruit(1)
    } else {
      const candidateA = officer.unit.subunits[0].officer
      const candidateB = officer.unit.subunits[1].officer
      replacement = (candidateA.experience > candidateB.experience) ? candidateA : candidateB
      this.replace(replacement)
      this.promote(replacement)
    }

    this.assign(replacement, officer.unit)
  }

  private recruit (tier: number): Officer {
    const recruit = new Officer(tier)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.staff.push(recruit)
    return recruit
  }

  private retire (officer: Officer) {
    this.reserve.push(officer)
    this.staff = this.staff.filter((o) => officer.id !== o.id )
    this.replace(officer)
  }

  private promote (officer: Officer) {
    officer.rank = new Rank(officer.rank.tier + 1)
  }

  private assign (officer: Officer, unit: Unit) {
    unit.officer = officer
    officer.unit = unit
  }

  private addSisters () {
    this.oob.forEach((unit) => {
      if (unit.parent) {
        unit.sister = unit.parent.subunits.find((u) => {
          return u.id !== unit.id
        })
      }
    })
  }

  private assignIds (unit: Unit) {
    unit.id = this.UNITID
    unit.officer.id = this.OFFICERID
    this.UNITID++
    this.OFFICERID++
  }

  private assignRelations (unit: Unit, parent: Unit) {
    unit.parent = parent
    parent.subunits.push(unit)
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

      this.oob.push(unit)
      this.staff.push(unit.officer)
    }
  }
}

export class Game {
  headquarter = new Headquarter()
  turn = 0
  status = 'playing'

  constructor () {
    this.tick()
  }

  private tick () {
    if (this.status === 'paused') return

    if (this.turn >= 500) debugger

    this.turn++
    this.headquarter.tick()

    setTimeout(() => this.tick(), 2)
  }
}
