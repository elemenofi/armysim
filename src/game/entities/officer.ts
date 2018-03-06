import * as chance from 'chance'
import { util } from '../util'
import { Headquarter } from './army'
import { Operation } from './operation'
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

  constructor (rank: number, private hq: Headquarter) {
    this.rank = new Rank(rank)
    this.hq = hq
    this.experience = 100 * rank + util.random(100)
    this.prestige = 0
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({
      gender: 'male',
    })} ${this.chance.last()}`
  }

  tick () {
    this.train()
    this.plot()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.isRetired() ? '(r) ' : ' '} ${this.name}`
  }

  public isSenior (): boolean {
    if (!this.competitor()) return true
    return this.experience > this.competitor().experience
  }

  public isRetired (): boolean {
    return this.experience > this.rank.max
  }

  public isPassedForPromotion (): boolean {
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

  private operate () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations.map((operation) => operation.target).includes(target)
  }

  private canOperateAgainst (target: Officer): boolean {
    return target &&
      this.operations.length < this.rank.tier &&
      !this.hasOperationAgainst(target)
  }

  private startOperationAgainst (target: Officer): void {
    if (!this.canOperateAgainst(target)) return

    const operation = new Operation(this, target, this.hq)

    this.operations.push(operation)
  }

  private plot (): void {
    this.operate()

    let target: Officer

    if (!this.isSenior()) {
      target = this.competitor()
    } else if (this.isPassedForPromotion()) {
      target = this.superior()
    }

    this.startOperationAgainst(target)
  }
}
