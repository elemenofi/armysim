import * as moment from 'moment'
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
    this.max = tier * 100 * 3
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
  events: string[] = []

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
  log: Logger

  constructor () {
    this.army = this.build(9)
    const officer = this.recruit(9)

    this.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)

    this.assignSister()
  }

  tick (turn) {
    // console.log(turn)

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
      const subunits = officer.unit.subunits
      const officer1 = subunits[0].officer
      const officer2 = subunits[1].officer

      replacement = (officer1.experience > officer2.experience)
        ? officer1
        : officer2

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
    officer.events.push(this.log.action('promote'))
  }

  private assign (officer: Officer, unit: Unit) {
    unit.officer = officer
    officer.unit = unit
  }

  private build (tier: number): Unit {
    const unit = new Unit(tier)
    unit.id = this.UNITID
    this.UNITID++
    if (tier < 9) this.oob.push(unit)
    return unit
  }

  private assignParent (unit: Unit, parent: Unit) {
    unit.parent = parent
    parent.subunits.push(unit)
  }

  private assignSister () {
    this.oob.forEach((unit) => {
      if (unit.parent) {
        unit.sister = unit.parent.subunits.find((u) => {
          return u.id !== unit.id
        })
      }
    })
  }

  private generateUnitsTree (tier: number, quantity: number, parent: Unit) {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = this.build(tier)
      const officer = this.recruit(tier)

      this.assign(officer, unit)
      this.assignParent(unit, parent)

      this.generateUnitsTree(tier - 1, 2, unit)
      this.generateUnitsTree(tier, quantity - 1, parent)
    }
  }
}

export class Game {
  headquarter: Headquarter
  logger: Logger
  turn = 0
  status = 'playing'

  constructor () {
    this.headquarter = new Headquarter()
    this.headquarter.log = new Logger(this)

    this.tick()
  }

  private tick () {
    if (this.status === 'paused') return

    if (this.turn >= 500) debugger

    this.turn++
    this.headquarter.tick(this.turn)

    setTimeout(() => this.tick(), 2)
  }
}

export class Logger {
  game: Game

  constructor (game) {
    this.game = game
  }

  action (action: string): string {
    return this[action]()
  }

  promote (): string {
    return moment().add(this.game.turn * 10, 'days').format('YYYY-MM-DD') + ' promoted'
  }
}


