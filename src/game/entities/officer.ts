import * as chance from 'chance'
import { Headquarter } from './army'
import { Rank } from './rank'
import { Trait, traitsService, TraitTypes } from './traits'
import { Unit } from './unit'
import { util } from './util'
import { Operations } from './operations';

export class Officer {
  id: number
  name: string
  experience: number
  militancy: number
  prestige: number
  skill: number
  align: number
  rank: Rank
  unit: Unit
  events: string[] = []
  chance: any
  inReserve: boolean
  traits: Trait[]
  isPlayer: boolean
  operations: Operations
  hq: Headquarter

  constructor (rank: number, hq: Headquarter) {
    this.rank = new Rank(rank)
    this.hq = hq
    this.experience = 100 * rank + util.random(100)
    this.prestige = 1
    this.militancy = 0
    this.align = util.random(100)
    this.skill = util.random(10)
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({ gender: 'male' })} ${this.chance.last()}`
    this.traits = traitsService.getInitialTraits()
    this.operations = new Operations(this)
  }

  tick () {
    if (this.isRetired()) this.hq.staff.retire(this)
    this.operations.tick()
    this.train()
    this.militate()
  }

  militate () {
    if (this.militancy > 1000) {
      this.operations.start(this.superior())
      this.militancy = 0
    } else if (this.isPassedForPromotion()) {
      this.militancy++
    }
  }

  fullName (): string {
    return `${this.rank.name()} ${this.isRetired() ? ' (r) ' : ''}${this.name}`
  }

  isSenior (): boolean {
    if (!this.competitor()) return true
    return this.experience > this.competitor().experience
  }

  isPassedForPromotion (): boolean {
    if (!this.superior()) return false
    return this.timeLeftInRank() < this.superior().timeLeftInRank()
  }

  getTotalTraitValue (type: string): number {
    return this.traitTypeValue(type)
  }

  getTotalTraitsValue (): number {
    return this.traitTypeValue('intelligence') +
      this.traitTypeValue('operations') +
      this.traitTypeValue('combat')
  }

  roll (): number {
    // console.log(this.getTotalTraitsValue())
    return util.random(10) + this.rank.tier
  }

  getNewTrait (): void {
    const newTrait = traitsService.getTraitByType(TraitTypes.special, this.traits)
    if (!newTrait) return
    this.traits.push(newTrait)
  }
  
  private traitTypeValue (type: string): number {
    const reducer = (accumulator, currentValue: Trait) => {
      return accumulator + currentValue[type]
    }

    return this.traits.reduce(reducer, 0)
  }

  private isRetired (): boolean {
    return this.experience > this.rank.max && this.rank.tier > 3
  }

  private train () {
    this.experience++
  }

  public superior (): Officer {
    if (!this.unit.parent) return
    return this.unit.parent.officer
  }

  public competitor (): Officer {
    if (!this.unit.sister) return
    return this.unit.sister.officer
  }

  private timeLeftInRank (): number {
    return this.rank.max - this.experience
  }

  private getSubordinates (): Officer[] {
    if (!this.unit.subunits.length) return []
    return [
      this.unit.subunits[0].officer,
      this.unit.subunits[1].officer,
    ]
  }
}
