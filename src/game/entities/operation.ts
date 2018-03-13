import { Headquarter } from './army'
import { Officer, TargetType } from './officer'
import { names, util } from './util'

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
  startedAs: string
  againstA: string
  because: string

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
    this.againstA = target.rank.name(),
    this.startedAs = officer.rank.name(),
    this.because = this.getReasonForOperation(),
    this.started = this.hq.log.day()
  }

  tick (): void {
    if (this.isReady()) this.executeOperation()

    if (this.isDone()) return

    this.decreaseTurns()

    this.increaseStrength()
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
      !this.counterOperation &&
      this.officer.rank.tier > 5 &&
      this.type === TargetType.superior &&
      this.officer.isInOppositeFaction(this.target) &&
      this.successfulRoll()
    ) {
      this.type = TargetType.coup
      this.hq.staff.coup(this.officer.faction.type)
      console.log(`
        ${this.hq.log.day()} An uprising led by ${this.officer.fullName()} against
        his superior officer ${this.target.fullName()} escalated
        into a Coup 'D Etat executed by the ${this.officer.faction.type} Faction
      `)
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
    if (!this.successfulRoll()) return
    return this.strength++
  }

  private successfulRoll (): boolean {
    return this.officer.roll() >
      this.target.roll()
  }

  private executeOperation (): void {
    if (this.successfulRoll()) {
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
    this.checkIfCoup()
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
