
import * as moment from 'moment'
import config from './config'
import Journal from './journal'
import Officer from './officer'
import Operation from './operation'
import Operations from './operations'
import Secretary from './secretary'
import Unit from './unit'
import util from './util'

interface Window { army: any, engine: any, command: any }

declare var window: Window

interface ReplaceSpec {
  replacedCommander: Officer
  unitId: number
  rank: string
  rankToPromote: string
}

export class Hq {
  rawDate: moment.Moment
  operations: Operations
  units: Unit[]
  realDate: string
  player: Officer
  target: Officer
  planner: Officer
  activeOfficers: Officer[]
  officersPool: Officer[]
  inspected: Officer
  OFFICERSID: number
  secretary: Secretary
  journal: Journal

  constructor () {
    this.operations = new Operations()
    this.journal = new Journal(this)
    this.rawDate = moment()
    this.units = []
    this.officersPool = []
    this.activeOfficers = []
    this.OFFICERSID = 1
    this.secretary = new Secretary()
    this.player = undefined
    this.inspected = undefined
  }

  updateDate () {
    this.rawDate = this.rawDate.add(1, 'days')
    if (window.army.engine && window.army.engine.turn > config.bufferTurns) {
      // perf trick
      this.realDate = this.journal.formatDate()
    }
  }

  update (triggeredByUserAction?: boolean) {
    if (!triggeredByUserAction) this.updateDate()

    this.activeOfficers
      .filter((officer) => officer)
      .forEach((officer) => { officer.update() })
  }

  makePlayer () {
    const squads = this.findUnitsByType('squad')
    const unit = squads[util.random(squads.length) + 1]

    unit.commander.reserved = true
    unit.commander = this.replaceForPlayer(unit.commander)

    this.player = unit.commander
    this.planner = this.player
  }

  replaceForPlayer (replacedCommander: Officer) {
    return this.recruit('lieutenant', replacedCommander.unitId, true, this.units[replacedCommander.unitId].name)
  }

  findUnitsByType (type: string) {
    return this.units.filter((unit) => unit.type === type)
  }

  findSubordinates (officer: Officer): Officer[] {
    const subordinates = []
    const subunits = this.units[officer.unitId].subunits

    if (!subunits.length) return []

    subordinates[0] = subunits[0].commander
    subordinates[1] = subunits[1].commander

    return subordinates
  }

  inspectOfficer (officerId: number) {
    this.inspected = this.officersPool[officerId]
  }

  targetOfficer (officerId: number) {
    this.target = this.officersPool[officerId]
  }

  recruit (rank: string, unitId: number, isPlayer ?: boolean, unitName ?: string): Officer {
    const options = {
      date: this.realDate,
      id: this.OFFICERSID,
      rankName: rank,
      unitId,
    }

    const cadet = new Officer(options, this, unitName, isPlayer)

    if (isPlayer) {
      this.player = cadet
    }

    this.activeOfficers[cadet.id] = cadet
    this.officersPool[cadet.id] = cadet
    this.OFFICERSID++

    return cadet
  }

  retire (officer: Officer) {
    const unit = this.units[officer.unitId]
    unit.commander = this.replace(unit.commander)

    this.activeOfficers[officer.id] = undefined
  }

  replace (replacedCommander: Officer): Officer {
    const lowerRank = this.secretary.rankLower(replacedCommander.rank)

    const spec = {
      rank: replacedCommander.rank.alias,
      rankToPromote: lowerRank,
      replacedCommander,
      unitId: replacedCommander.unitId,
    }

    if (lowerRank) {
      return this.candidate(spec)
    } else {
      return this.recruit(spec.rank, replacedCommander.unitId, false, this.units[spec.unitId].name)
    }
  }

  candidate (spec: ReplaceSpec): Officer {
    const parentUnit = this.units[spec.replacedCommander.unitId]
    const candidateA = parentUnit.subunits[0].commander
    const candidateB = parentUnit.subunits[1].commander
    const candidate: Officer = (candidateA.experience > candidateB.experience) ? candidateA : candidateB
    const cadidateUnit = this.units[candidate.unitId]

    cadidateUnit.commander = this.replace(cadidateUnit.commander)

    candidate.unitId = spec.unitId
    candidate.rank = this.secretary.ranks[spec.rank]

    candidate.history.push(this.journal.promoted(spec.rank, spec.unitId))

    candidate.superior = undefined

    return candidate
  }
}

export default Hq
