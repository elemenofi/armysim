import * as chance from 'chance'
import { util } from '../util'
import { Headquarter } from './army'
import { Faction, randomFaction } from './faction'
import { Operation, OperationStatus } from './operation'
import { Rank } from './rank'
import { Unit } from './unit'

export class Officer {
  id: number
  name: string
  experience: number
  prestige: number
  rank: Rank
  unit: Unit
  status: string
  events: string[] = []
  operations: Operation[] = []
  chance: any
  forcedToRetireBy: Operation
  faction: Faction

  constructor (rank: number, private hq: Headquarter) {
    this.rank = new Rank(rank)
    this.hq = hq
    this.experience = 100 * rank + util.random(100)
    this.prestige = 0
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({
      gender: 'male',
    })} ${this.chance.last()}`
    this.faction = new Faction()
  }

  tick () {
    this.train()
    this.plot()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.shouldRetire() ? '(r) ' : ' '} ${this.name}`
  }

  isSenior (): boolean {
    if (!this.competitor()) return true
    return this.experience > this.competitor().experience
  }

  isRetired (): boolean {
    return this.experience > this.rank.max
  }

  shouldRetire (): boolean {
    return !!(this.isRetired() || this.forcedToRetireBy)
  }

  isPassedForPromotion (): boolean {
    if (!this.superior()) return false
    return this.timeLeftInRank() < this.superior().timeLeftInRank()
  }

  private train () {
    this.experience++
  }

  private superior (): Officer {
    if (!this.unit.parent) return
    return this.unit.parent.officer
  }

  private competitor (): Officer {
    if (!this.unit.sister) return
    return this.unit.sister.officer
  }

  private timeLeftInRank (): number {
    return this.rank.max - this.experience
  }

  private plot (): void {
    this.handleExistingOperations()
    this.handlePossibleOperations()
  }

  private handlePossibleOperations () {
    const target = this.findTarget()
    if (!target) return
    if (this.canOperateAgainst(target)) this.startOperationAgainst(target)
  }

  private handleExistingOperations () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private findTarget (): Officer {
    if (!this.isSenior()) {
      return this.competitor()
    } else if (this.isPassedForPromotion()) {
      return this.superior()
    }
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations.map((operation) => operation.target).includes(target)
  }

  private canOperateAgainst (target: Officer): boolean {
    return !this.hasOperationAgainst(target) &&
      this.canStartNewOperation()
  }

  private canStartNewOperation (): boolean {
    const ongoing = this.operations
      .filter((o) => o.status === OperationStatus.planning)
      .length

    return ongoing < this.rank.tier
  }

  // when starting an operation the target has a chance to counter it
  // with an operation and the counterOperation flag prevents this happening
  // back and forth in a endless loop
  private startOperationAgainst (target: Officer, counterOperation = false): void {
    const operation = new Operation(this, target, this.hq, counterOperation)
    this.operations.push(operation)
    if (!counterOperation) target.attemptToCounterOperation(operation)
  }

  private attemptToCounterOperation (operation: Operation): void {
    if (operation.successfulCounter()) {
      operation.target.startOperationAgainst(operation.officer, true)
    }
  }
}
