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
    this.relate()
    if (this.experience > this.rank.maxxp) this.retire()
  }

  train () {
    this.experience++
  }

  retire () {
    this.reserved = true
    this.hq.retire(this)
  }

  relate () {
    const subordinates = this.hq.findSubordinates(this)
    const superior = this.hq.units[this.unitId].commander
  }
}

export default Officer
