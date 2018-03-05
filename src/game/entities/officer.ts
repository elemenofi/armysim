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
    if (!this.unit || !this.unit.parent) return
    this.operate()
    this.plot()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.isRetired() ? '(r) ' : ' '} ${this.name}`
  }

  public isRetired (): boolean {
    return this.experience > this.rank.max
  }

  private train () {
    this.experience++
    if (this.isRetired()) this.events.push(this.hq.log.reserve())
  }

  private superior (): Officer {
    return this.unit.parent.officer
  }

  private competitor (): Officer {
    return this.unit.sister.officer
  }

  private timeLeftInRank (): number {
    return this.rank.max - this.experience
  }

  private isPassedForPromotion (): boolean {
    return this.timeLeftInRank() < this.superior().timeLeftInRank()
  }

  private isSenior (): boolean {
    return this.experience > this.competitor().experience
  }

  private operate () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private plot (): void {
    let target: Officer

    if (!this.isSenior()) {
      target = this.competitor()
    } else if (this.isPassedForPromotion()) {
      target = this.superior()
    }

    if (!target) return
    if (this.operations.length > this.rank.tier) return
    if (this.hasOperationAgainst(target)) return

    const operation = new Operation(this, target, this.hq)

    this.operations.push(operation)
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations.map((operation) => operation.target).includes(target)
  }
}
