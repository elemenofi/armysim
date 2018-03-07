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
  started: string
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
    this.started = this.hq.log.day()
    // this.checkIfCoup()
  }

  tick (): void {
    if (this.isReady()) this.executeOperation()

    if (this.isDone()) return

    this.decreaseTurns()

    if (this.succesfulPlanning()) this.increaseStrength()
  }

  successfulCounter (): boolean {
    return util.random(10) +
      this.officer.rank.tier +
      this.officer.prestige >
      util.random(8) +
      this.target.rank.tier +
      this.target.prestige
  }

  private checkIfCoup (): void {
    if (
      this.officer.rank.tier > 4 &&
      this.type === TargetType.superior &&
      this.officer.isInOppositeFaction(this.target) &&
      this.successfulExecution()
    ) {
      this.hq.staff.coup(this.officer.faction.type)
    }
  }

  private isReady (): boolean {
    return this.strength === 100 && this.status === OperationStatus.planning
  }

  private isDone (): boolean {
    if (
      (this.turns <= 0 ||
      this.target.shouldRetire()) &&
      this.status === OperationStatus.planning
    ) {
      this.setStatus(OperationStatus.abandoned)
      this.log()
    }

    return this.status === OperationStatus.executed ||
      this.status === OperationStatus.failed ||
      this.status === OperationStatus.abandoned
  }

  private setStatus (status: OperationStatus): void {
    this.status = status
  }

  private decreaseTurns (): number {
    return this.turns--
  }

  private increaseStrength (): number {
    return this.strength++
  }

  private succesfulPlanning (): boolean {
    return util.random(10) + this.officer.rank.tier >
      util.random(10) + this.target.rank.tier
  }

  private successfulExecution (): boolean {
    return util.random(10) +
      this.officer.rank.tier +
      this.officer.prestige >
      util.random(10) +
      this.target.rank.tier +
      this.target.prestige
  }

  private executeOperation (): void {
    if (this.successfulExecution()) {
      this.applySuccessfulExecution()
    } else {
      this.applyFailedExecution()
    }
  }

  private applySuccessfulExecution (): void {
    this.setStatus(OperationStatus.executed)
    this.log()

    this.officer.prestige++

    this.setTargetForForcedRetirement()
  }

  private applyFailedExecution (): void {
    this.setStatus(OperationStatus.failed)
    this.log()

    this.officer.prestige--
  }

  private setTargetForForcedRetirement (): void {
    this.target.forcedToRetireBy = this
  }

  private log (): void {
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
