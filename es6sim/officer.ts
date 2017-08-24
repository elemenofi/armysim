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
  childhood: any
  teenhood: any
  college: any
  company: any
  field: any
  physical: any
  special: any
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
  history: {events: string[], reason?: Operation}
  rank: Rank
  rankName: string
  operations: Operation[]
  completed: Operation[]
  unit: Unit
  commander: Officer
  personality: Partial<Personality>
  chance: any
  retiredByOperation: Operation
  targets: number[]
  party: string
  militant: boolean
  badges: any[]
  dead: boolean
  operationDelay = 500
  hq: hq
  unitName: string
  school: School

  constructor (spec: Partial<Officer>, headquarters: hq, unitName: string) {
    this.isPlayer = spec.isPlayer
    this.chance = chance(Math.random)
    this.lname = this.chance.last()
    this.fname = this.chance.first({gender: 'male'})
    if (this.isPlayer) {
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
    }
    this.school = this.hq.secretary.schools[this.personality.base.area]
    this.intelligence = this.personality.base.intelligence + this.school.intelligence + util.random(10)
    this.commanding = this.personality.base.commanding + this.school.commanding + util.random(10)
    this.diplomacy = this.personality.base.diplomacy + this.school.diplomacy + util.random(10)
    this.alignment = util.random(10000)
    this.militant = false
    this.militancy = 0
    this.drift = Math.floor(Math.random() * 2) === 1 ? 1 : -1 // this is hardcoded now but it should be dynamic
    this.operations = []
    this.completed = []
    this.badges = []
    this.history = {
      events: [],
    }
    this.targets = []
    this.graduate(unitName)
  }

  name () {
    if (this.reserved && !this.dead) return this.rank.title + ' (R) ' + this.fname + ' ' + this.lname
    else if (!this.reserved) return this.rank.title + ' ' + this.fname + ' ' + this.lname
    else if (this.dead) return this.rank.title + ' (D) ' + this.fname + ' ' + this.lname
  }

  graduate (unitName: string) {
    this.history.events.push(this.hq.journal.graduated(this, unitName))
  }

  update () {
    this.experience++
    this.findCommander()
    this.sendToReserve()
    if (!this.reserved && this.experience > this.rank.maxxp) this.reserve()
    this.death()
  }

  death () {
    if (this.experience < 16000) return
    if (util.random(100) === 1) {
      this.dead = true
      this.reserve()
    }
  }

  sendToReserve () {
    this.hq.sendToReserve(this)
  }

  findCommander () {
    this.commander = this.hq.findCommander(this)
  }

  drifts () {
    // let parent
    // const unit = this.hq.findUnitById(this.unitId)
    // if (unit) parent = this.hq.findUnitById(unit.parentId)
    // if (parent) this.commander = parent.commander
    // else this.commander = undefined
  }

  align () {
    // if (
    //   this.drift > 0 && this.alignment < 10000 ||
    //   this.drift < 0 && this.alignment > 0
    // ) {
    //   this.alignment += this.drift
    // }

    // this.party = (this.alignment > 5000) ? 'Conservative' : 'Radical'
  }

  militate () {
    // this.militant = this.alignment > 9000 || this.alignment < 1000

    // if (this.militant && this.militancy < this.operationDelay) this.militancy++

    // if (this.militancy === this.operationDelay) {
    //   this.startOperation()
    //   this.militancy -= this.operationDelay
    // }
  }

  startOperation () {
    // const targets = this.chooseTarget()
    // if (!targets.length) return
    // targets.forEach((target) => {
    //   if (
    //     target &&
    //     // !this.isPlayer &&
    //     !this.reserved &&
    //     this.operations.length <= this.rank.hierarchy &&
    //     !this.targets[target.id] &&
    //     this.rank.hierarchy < target.rank.hierarchy + 2
    //   ) {

    //     const spec = {
    //       name: '',
    //       officer: this,
    //       target,
    //       type: this.personality.base.area,
    //     }

    //     this.hq.operations.add(spec, this.hq)
    //     this.targets[target.id] = target.id
    //   }
    // })
  }

  chooseTarget () {
    // const targets = []

    // if (this.commander && this.commander.party !== this.party ||
    //   this.commander &&
    //   this.commander.rank.maxxp - this.commander.experience > // time to retire if in same position
    //   this.rank.maxxp - this.experience) { // officers whose boss will retire after them will be enemies
    //   targets.push(this.commander)
    // }

    // if (this.commander) {
    //   // my colleague in rank under my commander will be an enemy if he is
    //   // from the other party or has more experience than i do
    //   this.hq.units[this.commander.unitId].subunits.forEach((unit) => {
    //     if (
    //       unit.commander.id !== this.id &&
    //       (
    //         unit.commander.party !== this.party ||
    //         unit.commander.experience > this.experience
    //       )
    //     ) {
    //       targets.push(unit.commander)
    //     }
    //   })
    // }

    // this.allSubordinates(this, this.rank.hierarchy - 1, targets)

    // return targets
  }

  allSubordinates = (officer: Officer, quantity: number, targets: Officer[]): void => {
    if (quantity === -1) return
    if (this.hq.units[officer.unitId]) {
      this.hq.units[officer.unitId].subunits.forEach((subunit) => {
        const commander = subunit.commander
        if (commander.party !== this.party) targets.push(commander)
        this.allSubordinates(commander, commander.rank.hierarchy - 1, targets)
      })
    }
  }

  isAlly (officer: Officer): boolean {
    return this.party === officer.party
  }

  reserve (operation ?: Operation) {
    let lastUnit = this.hq.units[this.unitId]

    if (this.rank.alias === 'general') {
      lastUnit = window.army.command
    }

    if (this.rank.hierarchy >= 4) lastUnit.reserve.unshift(this)
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop()

    this.reserved = true

    if (this.dead) {
      alert('a')
      this.history.events.push(this.hq.journal.formatDate() + ' buried with full Military Honors')
    } else if (!operation) {
      this.history.events.push('Moved to reserve on ' + this.hq.journal.formatDate())
    } else if (operation) {
      this.logRetirement(operation)
    }
  }

  logRetirement (operation: Operation) {
    operation.completed = this.hq.journal.formatDate()

    this.retiredByOperation = operation

    let lastRecord = this.history.events[this.history.events.length - 1]

    lastRecord = this.hq.realDate + ', retired by ' + operation.name + ', directed by ' + operation.officer.name()

    operation.target.history.events.push(lastRecord)

    operation.officer.history.events.push(this.hq.journal.operated(operation))

    // operation planned by player but carried out by someone else
    if (operation.byPlayer && !operation.officer.isPlayer) {
      this.hq.findPlayer().history.events.push(operation.name)
    }
  }
}

export default Officer
