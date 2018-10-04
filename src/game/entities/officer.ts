import * as chance from 'chance'
import { Headquarter } from './army'
import { Rank } from './rank'
import { Trait, traitsService, TraitTypes } from './traits'
import { Unit } from './unit'
import { util } from './util'

export class Officer {
  id: number
  name: string
  experience: number
  prestige: number
  militancy: number
  rank: Rank
  unit: Unit
  events: string[] = []
  chance: any
  inReserve: boolean
  traits: Trait[]
  isPlayer: boolean

  constructor (rank: number, private hq: Headquarter) {
    this.rank = new Rank(rank)
    this.hq = hq
    this.experience = 100 * rank + util.random(100)
    this.prestige = 0
    this.militancy = 0
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({ gender: 'male' })} ${this.chance.last()}`
    this.traits = traitsService.getInitialTraits(this)
  }

  tick () {
    if (this.shouldRetire()) this.hq.staff.retire(this)
      
    this.train()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.shouldRetire() ? ' (r) ' : ''}${this.name}`
  }

  isSenior (): boolean {
    if (!this.competitor()) return true
    return this.experience > this.competitor().experience
  }

  shouldRetire (): boolean {
    return !!(this.isRetired())
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
      this.traitTypeValue('communications')
  }

  roll (): number {
    return util.random(10) + this.rank.tier + this.getTotalTraitsValue()
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

  private getSubordinates (): Officer[] {
    if (!this.unit.subunits.length) return []
    return [
      this.unit.subunits[0].officer,
      this.unit.subunits[1].officer,
    ]
  }
}
