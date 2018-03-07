import { names, util } from '../util'
import { Headquarter } from './army'
import { Officer, TargetType } from './officer'

export enum OperationStatus {
  planning = 'planning',
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
  counterOperation: boolean
  status: OperationStatus
  hq: Headquarter
  logged: string
  type: string
  metadata: {
    startedAs: string,
    againstA: string,
    because: string,
  }

  constructor (officer: Officer, target: Officer, type: TargetType, hq: Headquarter, counterOperation = false) {
    this.hq = hq
    this.name = `${(counterOperation) ? 'Counter ' : ''}Operation ${names.nouns[util.random(names.nouns.length)]}`
    this.officer = officer
    this.target = target
    this.type = type
    this.strength = 0
    this.status = OperationStatus.planning
    this.turns = 365
    this.counterOperation = counterOperation
    this.populateMetadata()
  }

  tick (): void {
    if (this.isReady()) this.execute()

    if (this.isDone()) return

    this.decreaseTurns()

    if (this.succesfulPlanning()) this.increaseStrength()
  }

  isReady (): boolean {
    return this.strength === 100 && this.status === OperationStatus.planning
  }

  isDone (): boolean {
    if (
      (this.turns <= 0 ||
      this.target.shouldRetire()) &&
      this.status === OperationStatus.planning
    ) {
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

  successfulCounter (): boolean {
    return util.random(10) +
      this.officer.rank.tier +
      this.officer.prestige >
      util.random(8) +
      this.target.rank.tier +
      this.target.prestige
  }

  applySuccessfulExecution (): void {
    this.setStatus(OperationStatus.executed)
    this.log()

    this.officer.prestige++

    this.setTargetForForcedRetirement()
  }

  applyFailedExecution (): void {
    this.setStatus(OperationStatus.failed)
    this.log()

    this.officer.prestige--
  }

  setTargetForForcedRetirement (): void {
    this.target.forcedToRetireBy = this
  }

  log (): void {
    this.logged = this.hq.log.day()
  }

  private populateMetadata (): void {
    this.metadata = {
      againstA: this.target.rank.name(),
      startedAs: this.officer.rank.name(),
      because: this.getReasonForOperation(),
    }
  }

  private getReasonForOperation (): string {
    if (this.counterOperation) {
      return 'Officer was countering an operation.'
    } else if (this.officer.rank.tier === this.target.rank.tier) {
      return 'Officer was not candidate for promotion.'
    } else {
      return 'Officer was passed for promotion.'
    }
  }
}
