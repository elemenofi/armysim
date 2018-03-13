import * as chance from 'chance'
import { Headquarter } from './army'
import { Faction, FactionNames, randomFaction } from './faction'
import { Operation, OperationStatus } from './operation'
import { Rank } from './rank'
import { Trait, traitsService, TraitTypes } from './traits'
import { Unit } from './unit'
import { util } from './util'

export enum TargetType {
  superior = 'superior',
  competitor = 'competitor',
  subordinate = 'subordinate',
  coup = 'coup',
}

export interface PossibleTarget {
  target: Officer,
  type: TargetType
}

export class Officer {
  id: number
  name: string
  experience: number
  prestige: number
  commanding: number
  militancy: number
  rank: Rank
  unit: Unit
  events: string[] = []
  operations: Operation[] = []
  chance: any
  forcedToRetireBy: Operation
  faction: Faction
  inReserve: boolean
  traits: Trait[]

  constructor (rank: number, private hq: Headquarter) {
    this.rank = new Rank(rank)
    this.hq = hq
    this.experience = 100 * rank + util.random(100)
    this.prestige = 0
    this.militancy = 0
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({
      gender: 'male',
    })} ${this.chance.last()}`
    this.faction = new Faction()
    this.traits = traitsService.getInitialTraits(this)
  }

  tick () {
    this.train()
    this.plot()
    // this.debugAllyAndEnemies()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.shouldRetire() ? ' (r) ' : ''}${this.name}`
  }

  isSenior (): boolean {
    if (!this.competitor()) return true
    return this.experience > this.competitor().experience
  }

  shouldRetire (): boolean {
    return !!(this.isRetired() || this.forcedToRetireBy)
  }

  isPassedForPromotion (): boolean {
    if (!this.superior()) return false
    return this.timeLeftInRank() < this.superior().timeLeftInRank()
  }

  resistsCoup (faction: FactionNames): boolean {
    return this.faction.type === faction
  }

  getTotalTraitValue (type: string): number {
    return this.traitTypeValue(type)
  }

  getTotalTraitsValue (): number {
    return this.traitTypeValue('intelligence') +
      this.traitTypeValue('commanding') +
      this.traitTypeValue('diplomacy')
  }

  roll (): number {
    return util.random(10) + this.rank.tier + this.getTotalTraitsValue()
  }

  isInOppositeFaction (officer: Officer): boolean {
    return !this.isNeutral() &&
      !officer.isNeutral() &&
      this.faction.type !== officer.faction.type
  }

  getNewTrait (): void {
    this.traits.push(
      traitsService.getTraitByType(TraitTypes.special, this.traits),
    )
  }

  private traitTypeValue (type: string): number {
    const reducer = (accumulator, currentValue: Trait) => {
      return accumulator + currentValue[type]
    }

    return this.traits.reduce(reducer, 0)
  }

  private isRetired (): boolean {
    return this.experience > this.rank.max
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
    const possibleTarget = this.findTarget()
    if (!possibleTarget) return
    this.startOperationAgainst(possibleTarget)
  }

  private handleExistingOperations () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private findTarget (): PossibleTarget {
    if (!this.isSenior() && this.canOperateAgainst(this.competitor())) {
      return {
        target: this.competitor(),
        type: TargetType.competitor,
      }
    } else if (this.isPassedForPromotion() && this.canOperateAgainst(this.superior())) {
      return {
        target: this.superior(),
        type: TargetType.superior,
      }
    } else if (this.getEnemySubordinates().length && this.canOperateAgainst(this.getEnemySubordinates()[0])) {
      // todo: weird to return always the first in the array :s
      return {
        target: this.getEnemySubordinates()[0],
        type: TargetType.subordinate,
      }
    }
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations
      .map((operation) => operation.target)
      .includes(target)
  }

  private canOperateAgainst (target: Officer): boolean {
    return this.rank.tier > 2 &&
      !this.isNeutral() &&
      !this.isInSameFaction(target) &&
      !this.hasOperationAgainst(target) &&
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
  // back and forth in an endless loop
  private startOperationAgainst (possibleTarget: PossibleTarget, counterOperation = false): void {
    const operation = new Operation(this, possibleTarget.target, possibleTarget.type, this.hq, counterOperation)
    this.operations.push(operation)
    if (counterOperation) return
    this.militancy++
    possibleTarget.target.attemptToCounterOperation(operation, possibleTarget.type)
  }

  private attemptToCounterOperation (operation: Operation, type: TargetType): void {
    if (!operation.successfulCounter()) return
    operation.target.startOperationAgainst({target: operation.officer, type}, true)
  }

  private isNeutral (): boolean {
    return this.faction.type === FactionNames.center
  }

  private isInSameFaction (officer: Officer): boolean {
    return !this.isNeutral() &&
      this.faction.type === officer.faction.type
  }

  private getSubordinates (): Officer[] {
    if (!this.unit.subunits.length) return []
    return [
      this.unit.subunits[0].officer,
      this.unit.subunits[1].officer,
    ]
  }

  private getAllySubordinates (): Officer[] {
    return this.getSubordinates()
      .filter((o) => o.isInSameFaction(this))
  }

  private getEnemySubordinates (): Officer[] {
    return this.getSubordinates()
      .filter((o) => o.isInOppositeFaction(this))
  }

  private debugAllyAndEnemies () {
    if (this.rank.tier === 9 && this.getAllySubordinates().length || this.getEnemySubordinates().length) {
      console.log('inReserve', this.inReserve)
      console.log('faction', this.faction.type)
      console.log('allies', this.getAllySubordinates())
      console.log('enemies', this.getEnemySubordinates())
    }
  }
}
