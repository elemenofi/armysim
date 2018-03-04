import { names, util } from '../util'
import { Headquarter } from './army'
import { Officer } from './officer'

export enum OperationStatus {
  abandoned = 'abandoned',
  started = 'started',
  executed = 'executed',
  failed = 'failed',
}

export class Operation {
  id: number
  name: string
  officer: Officer
  target: Officer
  strength: number
  turns: number
  status: OperationStatus
  hq: Headquarter

  constructor (officer: Officer, target: Officer, hq: Headquarter) {
    this.hq = hq
    this.name = 'Operation ' + names.nouns[util.random(names.nouns.length)]
    this.officer = officer
    this.target = target
    this.strength = 0
    this.status = OperationStatus.started
    this.turns = 365
  }

  tick (): void {
    if (
      this.strength === 100 &&
      this.status === OperationStatus.started
    ) {
      this.execute()
    }

    if (
      this.status === OperationStatus.executed ||
      this.status === OperationStatus.failed ||
      this.status === OperationStatus.abandoned
    ) {
      return
    }

    if (this.turns <= 0 || this.target.isRetired) {
      this.status = OperationStatus.abandoned
      return
    }

    this.turns--

    if (util.random(10) + this.officer.rank.tier > util.random(10) + this.target.rank.tier) {
      this.strength++
    }
  }

  execute (): void {
    if (
        util.random(10) +
        this.officer.rank.tier +
        this.officer.prestige
        >
        util.random(10) +
        this.target.rank.tier +
        this.target.prestige
    ) {
      this.officer.events.push(this.hq.log.plot(OperationStatus.executed, this))
      this.status = OperationStatus.executed
      this.officer.prestige++

      this.target.isRetired = true
      this.target.events.push(this.hq.log.retire(this))
    } else {
      this.officer.events.push(this.hq.log.plot(OperationStatus.failed, this))
      this.status = OperationStatus.failed
      this.officer.prestige--
    }
  }
}
