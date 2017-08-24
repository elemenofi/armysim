import * as moment from 'moment'
import config from './config'
import hq from './hq'
import names from './names'
import Officer from './officer'
import util from './util'

export class Operation {
  id: number
  officer: Officer
  target: Officer
  type: string
  name: string
  strength: number
  turns: number
  logged: boolean
  byPlayer: boolean
  completed: string
  description: string
  descriptions = {
    intelligence: 'infiltrating',
    commanding: 'assaulting',
    diplomacy: 'negotiating with',
  }

  constructor (spec) {
    this.officer = spec.officer
    this.target = spec.target
    this.type = spec.type
    this.name = 'Operation ' + names.nouns[util.random(names.nouns.length)]
    this.strength = 0
    this.turns = 1000
    this.byPlayer = spec.byPlayer
    this.description = this.descriptions[spec.type]
  }

  roll (officer: Officer): number {
    const o = officer
    let roll
    roll =
      o[this.type] +
      o.intelligence +
      o.rank.hierarchy +
      util.random(10)

    roll += (o.commander && o.commander.party === o.party) ? o.commander.rank.hierarchy : 0

    return roll
  }

  execute (hq: hq): void {
    const targetRoll = this.roll(this.target)
    const officerRoll = this.roll(this.officer)

    if ((officerRoll) > (targetRoll)) {
      this.strength++
    }

    if (this.strength >= 300) {
      this.target.reserve(hq, this)
      this.officer.prestige += 10
      this.officer.prestige += this.target.prestige
      this.officer.operations[this.officer.operations.indexOf(this)] = undefined
      this.officer.completed.push(this)
      if (this.byPlayer) {
        hq.findPlayer().operations[hq.findPlayer().operations.indexOf(this)] = undefined
        hq.findPlayer().completed.push(this)
      }
    }

    this.turns--
  }
}

export default Operation
