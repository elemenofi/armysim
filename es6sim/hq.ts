
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
  activeOperations: Operation[]
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
    this.units.map((unit) => this.reserve(unit))
    this.operations.update(this)
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

  findUnitsByType (type: string) {
    return this.units.filter((unit) => unit.type === type)
  }

  retireOfficer (officer: Officer) {
    this.activeOfficers[officer.id] = undefined
  }

  findCommander (officer: Officer): Officer {
    let commander
    const unit = this.units[officer.unitId]
    const parentUnit = this.units[unit.parentId]
    if (parentUnit) commander = parentUnit.commander
    else commander = undefined
    return commander
  }

  inspectOfficer (officerId: number) {
    const officer = this.officersPool[officerId]
    this.inspected = officer
    return officer
  }

  targetOfficer (officerId: number) {
    const officer = this.officersPool[officerId]
    const subordinates = this.directSubordinates(this.player) as any

    // weird logic
    if (this.planner.id === officer.id && !officer.isPlayer) {
      this.target = officer
      this.planner = this.player
    } else if (officer.isPlayer || subordinates.includes(officer)) {
      this.planner = officer
    } else {
      this.target = officer
    }

    return officer
  }

  directSubordinates (officer: Officer): Officer[] {
    const subordinates: Officer[] = []
    const unit = this.units[officer.unitId]
    if (unit && unit.subunits) {
      unit.subunits.forEach((su) => {
        subordinates.push(su.commander)
      })
    }
    return subordinates
  }

  allSubordinates = (officer: Officer, quantity: number): Officer[] => {
    const subordinates: Officer[] = []
    if (quantity === -1) return
    if (this.units[officer.unitId]) {
      this.units[officer.unitId].subunits.forEach((subunit) => {
        const commander = subunit.commander
        subordinates.push(commander)
        this.allSubordinates(commander, commander.rank.hierarchy - 1)
      })
    }
    return subordinates
  }

  add (unit: Unit) {
    this.units.push(unit)
  }

  reserve (unit: Unit) {
    if (unit.commander.reserved) this.replace(unit)
  }

  replace (unit: Unit) {
    unit.commander = this.replaceOfficer(unit.commander)
  }

  replaceOfficer (replacedCommander: Officer) {
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

  candidate (spec: ReplaceSpec) {
    const parentUnit = this.units[spec.replacedCommander.unitId]
    const candidateA = parentUnit.subunits[0].commander
    const candidateB = parentUnit.subunits[1].commander
    const candidate: Officer = (candidateA.experience > candidateB.experience) ? candidateA : candidateB

    return this.promote(candidate, spec)
  }

  replaceForPlayer (replacedCommander: Officer) {
    return this.recruit('lieutenant', replacedCommander.unitId, true, this.units[replacedCommander.unitId].name)
  }

  recruit (rank: string, unitId: number, isPlayer ?: boolean, unitName ?: string) {
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

  deassign (id: number) {
    this.replace(this.units[id])
  }

  promote (officer: Officer, spec: ReplaceSpec) {
    this.deassign(officer.unitId)
    const promotion = this.promotion(officer, spec)
    officer.history.push(this.journal.promoted(spec.rank, spec.unitId))
    officer.targets = []
    officer.commander = undefined
    return officer
  }

  promotion (officer: Officer, spec: any) {
    officer.unitId = spec.unitId
    officer.rank = this.secretary.ranks[spec.rank]

    return {
      date: this.journal.formatDate(),
      rank: spec.rank,
      unit: this.units[officer.unitId].name,
    }
  }
}

export default Hq
