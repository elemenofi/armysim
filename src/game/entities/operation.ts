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
    if (this.isReady()) this.execute()

    if (this.isDone()) return

    if (this.isAbandoned()) {
      this.setStatus(OperationStatus.abandoned)
      return
    }

    this.turns--

    if (this.shouldStrengthen()) this.strength++
  }

  isReady (): boolean {
    return this.strength === 100 && this.status === OperationStatus.started
  }

  isDone (): boolean {
    return this.status === OperationStatus.executed ||
      this.status === OperationStatus.failed ||
      this.status === OperationStatus.abandoned
  }

  isAbandoned (): boolean {
    return this.turns <= 0 || this.target.isRetired
  }

  setStatus (status: OperationStatus): void {
    this.status = status
  }

  shouldStrengthen (): boolean {
    return util.random(10) + this.officer.rank.tier >
      util.random(10) + this.target.rank.tier
  }

  successfulExecution (): boolean {
    return util.random(10) +
      this.officer.rank.tier +
      this.officer.prestige >
      util.random(10) +
      this.target.rank.tier +
      this.target.prestige
  }

  logExecution (): void {
    this.officer.events.push(this.hq.log.plot(OperationStatus.executed, this))
    this.target.events.push(this.hq.log.retire(this))
  }

  logFailure (): void {
    this.officer.events.push(this.hq.log.plot(OperationStatus.failed, this))
  }

  execute (): void {
    if (this.successfulExecution()) {
      this.setStatus(OperationStatus.executed)
      this.logExecution()

      this.officer.prestige++
      this.target.isRetired = true
    } else {
      this.setStatus(OperationStatus.failed)
      this.logFailure()

      this.officer.prestige--
    }
  }
}
