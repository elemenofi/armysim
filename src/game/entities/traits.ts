import { Officer } from './officer'
import { Rank } from './rank'
import { util } from './util'

export interface Trait {
  name: string
  intelligence: number
  operations: number
  communications: number
  type: string
  opposite?: string
}

export enum TraitTypes {
  base = 'base',
  aptitude = 'aptitude',
  physical = 'physical',
  childhood = 'childhood',
  special = 'special',
}

export class Traits {
  traits: Trait[]

  constructor (traits: Trait[]) {
    this.traits = traits
  }

  getInitialTraits (officer: Officer): Trait[] {
    return [
      this.getTraitByType(TraitTypes.base),
      this.getTraitByType(TraitTypes.childhood),
      this.getTraitByType(TraitTypes.aptitude),
      this.getTraitByType(TraitTypes.physical),
    ]
  }

  getTraitByType (type: TraitTypes, traits: Trait[] = []): Trait {
    const traitsOfType = this.traits.filter((t) => {
      return t.type === type && !traits.includes(t)
    })
    const randomNumber = util.random(traitsOfType.length - 1)
    const randomTrait = traitsOfType[randomNumber]

    // dont return trait if officer had the opposite one
    if (traits.filter((t) => t.opposite === randomTrait.name).length) {
      return
    }

    return randomTrait
  }
}

const allTraits: Trait[] = [
  {
    name: 'Diplomat',
    intelligence: 3,
    operations: 2,
    communications: 5,
    type: TraitTypes.base,
  },
  {
    name: 'Warrior',
    intelligence: 2,
    operations: 5,
    communications: 1,
    type: TraitTypes.base,
  },
  {
    name: 'Spy',
    intelligence: 5,
    operations: 1,
    communications: 3,
    type: TraitTypes.base,
  },
  {
    name: 'Smart',
    operations: 2,
    intelligence: 2,
    communications: 2,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Slow',
    operations: -2,
    intelligence: -2,
    communications: -2,
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Capable',
    operations: 1,
    intelligence: 1,
    communications: 1,
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Talented',
    operations: 3,
    intelligence: 3,
    communications: 3,
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Silly',
    operations: -3,
    intelligence: -3,
    communications: -3,
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Unreliable',
    operations: -1,
    intelligence: -1,
    communications: 0,
    type: TraitTypes.aptitude,
    opposite: 'Smart',
  },
  {
    name: 'Handsome',
    operations: 1,
    intelligence: 0,
    communications: 1,
    type: TraitTypes.physical,
    opposite: 'Ugly',
  },
  {
    name: 'Ugly',
    operations: -1,
    intelligence: 0,
    communications: -1,
    type: TraitTypes.physical,
    opposite: 'Handsome',
  },
  {
    name: 'Tall',
    operations: 2,
    intelligence: 1,
    communications: 1,
    type: TraitTypes.physical,
    opposite: 'Short',
  },
  {
    name: 'Short',
    operations: -2,
    intelligence: 2,
    communications: -1,
    type: TraitTypes.physical,
    opposite: 'Tall',
  },
  {
    name: 'Fat',
    operations: -3,
    intelligence: 0,
    communications: -3,
    type: TraitTypes.physical,
  },
  {
    name: 'Strong',
    operations: 3,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.physical,
    opposite: 'Weak',
  },
  {
    name: 'Weak',
    operations: -3,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.physical,
    opposite: 'Strong',
  },
  {
    name: 'Responsible',
    operations: 2,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.childhood,
  },
  {
    name: 'Spoiled',
    operations: -2,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.childhood,
  },
  {
    name: 'Charismatic',
    operations: 4,
    intelligence: 2,
    communications: 4,
    type: TraitTypes.childhood,
  },
  {
    name: 'Bully',
    operations: 4,
    intelligence: -2,
    communications: -2,
    type: TraitTypes.childhood,
  },
  {
    name: 'Urchin',
    operations: 0,
    intelligence: 5,
    communications: 3,
    type: TraitTypes.childhood,
  },
  {
    name: 'Ambitious',
    operations: 1,
    intelligence: 1,
    communications: 1,
    type: TraitTypes.special,
  },
  {
    name: 'Lazy',
    operations: -1,
    intelligence: -1,
    communications: -1,
    type: TraitTypes.special,
    opposite: 'Diligent',
  },
  {
    name: 'Diligent',
    operations: 1,
    intelligence: 1,
    communications: 1,
    type: TraitTypes.special,
    opposite: 'Lazy',
  },
  {
    name: 'Eccentric',
    operations: 0,
    intelligence: 0,
    communications: -2,
    type: TraitTypes.special,
  },
  {
    name: 'Eloquent',
    operations: 0,
    intelligence: 0,
    communications: 2,
    type: TraitTypes.special,
  },
  {
    name: 'Brave',
    operations: 2,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.special,
    opposite: 'Coward',
  },
  {
    name: 'Coward',
    operations: -2,
    intelligence: 0,
    communications: 0,
    type: TraitTypes.special,
    opposite: 'Brave',
  },
  {
    name: 'Subtle',
    operations: 0,
    intelligence: 2,
    communications: 0,
    type: TraitTypes.special,
    opposite: 'Crude',
  },
  {
    name: 'Crude',
    operations: 0,
    intelligence: 2,
    communications: 0,
    type: TraitTypes.special,
    opposite: 'Subtle',
  },
  {
    name: 'Pedantic',
    operations: 0,
    intelligence: 0,
    communications: -1,
    type: TraitTypes.special,
  },
  {
    name: 'Funny',
    operations: 0,
    intelligence: 0,
    communications: 2,
    type: TraitTypes.special,
    opposite: 'Boring',
  },
  {
    name: 'Boring',
    operations: 0,
    intelligence: 0,
    communications: 2,
    type: TraitTypes.special,
    opposite: 'Funny',
  },
]

export const traitsService = new Traits(allTraits)
