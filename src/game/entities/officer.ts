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
  superior: Officer
  competitor: Officer
  timeLeftInRank: number
  isPassedForPromotion: boolean
  isRetired: boolean
  isSenior: boolean
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
    this.relate()
    this.operate()
    this.plot()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.isRetired ? '(r) ' : ' '} ${this.name}`
  }

  private train () {
    this.experience++
    this.timeLeftInRank = this.rank.max - this.experience
    this.isRetired = this.experience > this.rank.max
    if (this.isRetired) this.events.push(this.hq.log.reserve())
  }

  private relate () {
    const parent = this.unit.parent
    this.superior = parent.officer
    this.competitor = this.unit.sister.officer
    this.isPassedForPromotion =
      this.timeLeftInRank < this.superior.timeLeftInRank
    this.isSenior = this.experience > this.competitor.experience
  }

  private operate () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private plot (): void {
    let target: Officer

    if (!this.isSenior) {
      target = this.competitor
    } else if (this.isPassedForPromotion) {
      target = this.superior
    }

    if (!target) return
    if (this.operations.length > this.rank.tier) return
    if (this.hasOperationAgainst(target)) return

    const operation = new Operation(this, target, this.hq)

    this.operations.push(operation)
  }

  private target (target: Officer): void {
    if (!target) return
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations.map((operation) => operation.target).includes(target)
  }
}
