import { names, util } from '../util'
import { Headquarter } from './army'
import { Officer } from './officer'

export enum OperationStatus {
  planned = 'planned',
  executed = 'executed',
  failed = 'failed',
  abandoned = 'abandoned',
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
    this.status = OperationStatus.planned
    this.turns = 365
  }

  tick (): void {
    if (this.isReady()) this.execute()

    if (this.isDone()) return

    this.decreaseTurns()

    if (this.succesfulPlanning()) this.increaseStrength()
  }

  isReady (): boolean {
    return this.strength === 100 && this.status === OperationStatus.planned
  }

  isDone (): boolean {
    if (this.turns <= 0 || this.target.isRetired()) {
      this.setStatus(OperationStatus.abandoned)
    }

    return this.status === OperationStatus.executed ||
      this.status === OperationStatus.failed ||
      this.status === OperationStatus.abandoned
  }

  setStatus (status: OperationStatus): void {
    this.status = status
  }

  decreaseTurns (): number {
    return this.turns--
  }

  increaseStrength (): number {
    return this.strength++
  }

  succesfulPlanning (): boolean {
    return util.random(10) + this.officer.rank.tier >
      util.random(10) + this.target.rank.tier
  }

  execute (): void {
    if (this.successfulExecution()) {
      this.applySuccessfulExecution()
    } else {
      this.applyFailedExecution()
    }
  }

  successfulExecution (): boolean {
    return util.random(10) +
      this.officer.rank.tier +
      this.officer.prestige >
      util.random(10) +
      this.target.rank.tier +
      this.target.prestige
  }

  applySuccessfulExecution (): void {
    this.setStatus(OperationStatus.executed)
    this.logExecution()

    this.officer.prestige++

    this.setTargetForForcedRetirement()
  }

  applyFailedExecution (): void {
    this.setStatus(OperationStatus.failed)
    // this.logFailure()

    this.officer.prestige--
  }

  setTargetForForcedRetirement (): void {
    this.target.forcedToRetireBy = this
  }

  logExecution (): void {
    this.officer.events.push(this.hq.log.plot(OperationStatus.executed, this))
  }

  logFailure (): void {
    this.officer.events.push(this.hq.log.plot(OperationStatus.failed, this))
  }
}
