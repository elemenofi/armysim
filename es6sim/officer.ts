import * as moment from 'moment'
import config from './config'
import hq from './hq'
import Journal from './journal'
import * as chance from './lib/chance'
import Operation from './operation'
import { School } from './secretary'
import { Trait, Traits } from './traits'
import Unit from './unit'
import util from './util'

interface Window { army: any; command: any }
declare var window: Window
const traits = new Traits()

interface Chance {
  last (): string
  first (o: object): string
  word (l: number): string
}

export interface Rank {
  hierarchy: number
  title: string
  alias: string
  startxp: number
  maxxp: number
  startpr: number
}

export interface Personality {
  base: Trait
  cognitive: Trait
  look: Trait
  childhood: Trait
  teenhood: Trait
  college: Trait
  special: Trait
}

export class Officer implements Officer {
  lname: string
  fname: string
  id: number
  isPlayer: boolean
  unitId: number
  reserved: boolean
  experience: number
  prestige: number
  intelligence: number
  diplomacy: number
  commanding: number
  alignment: number
  militancy: number
  drift: number
  history: string[]
  rank: Rank
  rankName: string
  operations: Operation[]
  completed: Operation[]
  unit: Unit
  superior: Officer
  personality: Partial<Personality>
  chance: any
  targets: number[]
  party: string
  militant: boolean
  badges: any[]
  dead: boolean
  hq: hq
  unitName: string
  school: School
  relations: Officer[] = []
  opinions = []
  threatened = []
  bonded = []
  attacking = []
  friends = []
  nominated: number
  passed: number

  constructor (spec: Partial<Officer>, headquarters: hq, unitName: string, isPlayer: boolean) {
    this.isPlayer = isPlayer
    this.chance = chance(Math.random)
    this.lname = this.chance.last()
    this.fname = this.chance.first({gender: 'male'})

    if (isPlayer) {
      this.lname = (config.debug) ? 'Richardson' : prompt('Name?')
      this.fname = 'John'
    }

    this.hq = headquarters
    this.id = spec.id
    this.unitId = spec.unitId
    this.reserved = false
    this.rank = this.hq.secretary.ranks[spec.rankName]
    this.experience = this.hq.secretary.ranks[spec.rankName].startxp + util.random(500)
    this.prestige = 0

    this.personality = {
      base: traits.random('base'),
      childhood: traits.random('childhood'),
      cognitive: traits.random('cognitive'),
      look: traits.random('look'),
      college: traits.random('college'),
      special: traits.random('special'),
    }

    this.intelligence = this.personality.base.intelligence + util.random(10) + this.bonus('intelligence')
    this.commanding = this.personality.base.commanding + util.random(10) + + this.bonus('commanding')
    this.diplomacy = this.personality.base.diplomacy + util.random(10) + + this.bonus('diplomacy')

    this.alignment = util.random(10000)
    this.militant = false
    this.militancy = 0
    this.drift = Math.floor(Math.random() * 2) === 1 ? 1 : -1 // this is hardcoded now but it should be dynamic

    this.operations = []
    this.completed = []
    this.badges = []
    this.history = []

    this.school = this.hq.secretary.schools[this.personality.base.area]
    this.graduate(unitName)
  }

  bonus (type: string) {
    let sum = 0

    Object.keys(this.personality).forEach((key) => {
      sum += this.personality[key][type]
    })

    return sum
  }

  name () {
    if (this.reserved && !this.dead) return this.rank.title + ' (R) ' + this.fname + ' ' + this.lname
    else if (!this.reserved) return this.rank.title + ' ' + this.fname + ' ' + this.lname
    else if (this.dead) return this.rank.title + ' (D) ' + this.fname + ' ' + this.lname
  }

  graduate (unitName: string) {
    this.history.push(this.hq.journal.graduated(this, unitName))
  }

  update () {
    this.train()
    this.nominate()
    this.pass()
    // this.relate()
    if (this.experience > this.rank.maxxp) this.retire()
  }

  train () {
    this.experience++
  }

  competitor (): Officer {
    const unit = this.hq.units[this.unitId]
    const command = this.hq.units[unit.parentId]
    const subunits = (command) ? command.subunits : undefined

    const otherUnit = (subunits) ? subunits.filter((u) => {
      return u.id !== unit.id
    })[0] : undefined

    return (otherUnit) ? otherUnit.commander : undefined
  }

  commander (): Officer {
    const unit = this.hq.units[this.unitId]
    const command = this.hq.units[unit.parentId]
    const superior = (command) ? command.commander : undefined

    return superior
  }

  pass () {
    const unit = this.hq.units[this.unitId]
    const command = this.hq.units[unit.parentId]
    const commander = this.commander()
    const ranks = this.hq.secretary.ranks

    this.passed = (
      this.commander() &&
      ranks[commander.rank.alias].maxxp - commander.experience >
      ranks[this.rank.alias].maxxp - this.experience
    ) ? 1 : 0
  }

  nominate () {
    this.nominated = (
      this.competitor() &&
      this.experience > this.competitor().experience
    ) ? 1 : 0
  }

  retire () {
    this.reserved = true
    this.hq.retire(this)
  }

  relate () {
    const unit = this.hq.units[this.unitId]
    const command = this.hq.units[unit.parentId]
    const superior = (command) ? command.commander : undefined
    const subordinates = this.hq.findSubordinates(this)
    const related = [subordinates[0], subordinates[1], superior]
    const ranks = this.hq.secretary.ranks

    related
      .filter((officer) => {
        return officer && officer.id
      })
      .forEach((officer) => {
        let opinion = this.opinions[officer.id] || 0

        // if (this.isPlayer) {
        //   console.log('boss', ranks[superior.rank.alias].maxxp - superior.experience)
        //   console.log('me', ranks[this.rank.alias].maxxp - this.experience)
        //   console.log('opinion', this.opinions[superior.id])
        // }

        if (
          opinion < 365
        ) {
          opinion += 1
        }

        if (
          superior &&
          officer.id === superior.id &&
          (ranks[superior.rank.alias].maxxp - superior.experience >
          ranks[this.rank.alias].maxxp - this.experience)
        ) {
          if (opinion > -365) opinion -= 2
        }

        if (!officer.reserved && !this.reserved) {
          this.act(opinion, officer)
        }

        this.opinions[officer.id] = opinion
      })
  }

  act (opinion: number, officer: Officer) {
    if (opinion < 0) {
      this.threat(officer)
    }

    if (opinion > 0) {
      this.friend(officer)
    }

    if (opinion === 365) {
      this.bond(officer)
    }

    if (opinion <= -365) {
      this.attack(officer)
    }
  }

  friend (officer: Officer) {
    if (this.friends[officer.id]) return

    this.friends[officer.id] = true
    this.threatened[officer.id] = false
  }

  threat (officer: Officer) {
    if (this.threatened[officer.id]) return

    this.threatened[officer.id] = true
    this.bonded[officer.id] = false
    this.friends[officer.id] = false

    this.history.push(this.hq.journal.action('threatened by', officer))
  }

  bond (officer: Officer) {
    if (this.bonded[officer.id]) return

    this.threatened[officer.id] = false
    this.bonded[officer.id] = true

    this.history.push(this.hq.journal.action('bonded with', officer))
  }

  attack (officer: Officer) {
    if (this.commanding > officer.commanding) {
      this.attacking[officer.id] = true
      officer.reserved = true
      this.hq.retire(officer)
      this.history.push(this.hq.journal.action('attacked', officer))
    }
  }
}

export default Officer
