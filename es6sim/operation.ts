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
    this.byPlayer = spec.byPlayer
    this.description = this.descriptions[spec.type]
  }
}

export default Operation
