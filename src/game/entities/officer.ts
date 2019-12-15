import * as chance from 'chance'
import { Headquarter } from './army'
import { Rank } from './rank'
import { Trait, traitsService, TraitTypes } from './traits'
import { Unit } from './unit'
import { util } from './util'
import { Operations } from './operations';
import { Skills } from './skills'
import { Attributes } from './attributes'
import { Politics } from './politics'

export class Officer {
  id: number
  chance: any
  name: string
  rank: Rank
  unit: Unit
  events: string[] = []
  inReserve: boolean
  isPlayer: boolean
  traits: Trait[]
  operations: Operations
  hq: Headquarter
  skills: Skills
  attributes: Attributes
  politics: Politics

  constructor (rank: number, hq: Headquarter) {
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({ gender: 'male' })} ${this.chance.last()}`
    this.rank = new Rank(rank)
    this.hq = hq
    this.traits = traitsService.getInitialTraits()
    this.operations = new Operations(this)
    this.skills = new Skills();
    this.politics = new Politics();
    this.attributes = new Attributes();
    this.attributes.experience = 100 * rank + util.random(100)
  }

  tick () {
    if (this.isRetired()) this.hq.staff.retire(this)
    this.operations.tick()
    this.train()
    if (this.isPlayer) console.log(this.attributes.martial);
  }

  fullName (): string {
    return `${this.rank.name()} ${this.isRetired() ? ' (r) ' : ''}${this.name}`
  }

  isSenior (): boolean {
    if (!this.competitor()) return true
    return this.attributes.experience > this.competitor().attributes.experience
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
    return this.attributes.experience > this.rank.max && this.rank.tier > 3
  }

  private train () {
    this.attributes.experience++
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
    return this.rank.max - this.attributes.experience
  }

  private getSubordinates (): Officer[] {
    if (!this.unit.subunits.length) return []
    return [
      this.unit.subunits[0].officer,
      this.unit.subunits[1].officer,
    ]
  }
}
