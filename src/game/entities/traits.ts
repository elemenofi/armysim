import { Officer } from './officer'
import { Rank } from './rank'
import { util } from './util'

export interface Trait {
  name: string
  intelligence: number
  commanding: number
  diplomacy: number
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
    const possible = this.traits.filter((t) => {
      return t.type === type &&
        !traits.includes(t) &&
        !traits.filter((tr) => tr.opposite === type).length
    })
    const randomNumber = util.random(possible.length - 1)
    const randomTrait = possible[randomNumber]

    return randomTrait
  }
}

const allTraits: Trait[] = [
  {
    name: 'Diplomat',
    intelligence: 3,
    commanding: 2,
    diplomacy: 5,
    type: TraitTypes.base,
  },
  {
    name: 'Commander',
    intelligence: 2,
    commanding: 5,
    diplomacy: 1,
    type: TraitTypes.base,
  },
  {
    name: 'Spy',
    intelligence: 5,
    commanding: 1,
    diplomacy: 3,
    type: TraitTypes.base,
  },
  {
    name: 'Smart',
    commanding: 2,
    intelligence: 2,
    diplomacy: 2,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Slow',
    commanding: -2,
    intelligence: -2,
    diplomacy: -2,
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Capable',
    commanding: 1,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Talented',
    commanding: 3,
    intelligence: 3,
    diplomacy: 3,
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Silly',
    commanding: -3,
    intelligence: -3,
    diplomacy: -3,
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Unreliable',
    commanding: -1,
    intelligence: -1,
    diplomacy: 0,
    type: TraitTypes.aptitude,
    opposite: 'Smart',
  },
  {
    name: 'Handsome',
    commanding: 1,
    intelligence: 0,
    diplomacy: 1,
    type: TraitTypes.physical,
    opposite: 'Ugly',
  },
  {
    name: 'Ugly',
    commanding: -1,
    intelligence: 0,
    diplomacy: -1,
    type: TraitTypes.physical,
    opposite: 'Handsome',
  },
  {
    name: 'Tall',
    commanding: 2,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.physical,
    opposite: 'Short',
  },
  {
    name: 'Short',
    commanding: -2,
    intelligence: 2,
    diplomacy: -1,
    type: TraitTypes.physical,
    opposite: 'Tall',
  },
  {
    name: 'Fat',
    commanding: -3,
    intelligence: 0,
    diplomacy: -3,
    type: TraitTypes.physical,
  },
  {
    name: 'Strong',
    commanding: 3,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.physical,
    opposite: 'Weak',
  },
  {
    name: 'Weak',
    commanding: -3,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.physical,
    opposite: 'Strong',
  },
  {
    name: 'Responsible',
    commanding: 2,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.childhood,
  },
  {
    name: 'Spoiled',
    commanding: -2,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.childhood,
  },
  {
    name: 'Charismatic',
    commanding: 4,
    intelligence: 2,
    diplomacy: 4,
    type: TraitTypes.childhood,
  },
  {
    name: 'Bully',
    commanding: 4,
    intelligence: -2,
    diplomacy: -2,
    type: TraitTypes.childhood,
  },
  {
    name: 'Urchin',
    commanding: 0,
    intelligence: 5,
    diplomacy: 3,
    type: TraitTypes.childhood,
  },
  {
    name: 'Ambitious',
    commanding: 1,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.special,
  },
  {
    name: 'Lazy',
    commanding: -1,
    intelligence: -1,
    diplomacy: -1,
    type: TraitTypes.special,
    opposite: 'Diligent',
  },
  {
    name: 'Diligent',
    commanding: 1,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.special,
    opposite: 'Lazy',
  },
  {
    name: 'Eccentric',
    commanding: 0,
    intelligence: 0,
    diplomacy: -2,
    type: TraitTypes.special,
  },
  {
    name: 'Eloquent',
    commanding: 0,
    intelligence: 0,
    diplomacy: 2,
    type: TraitTypes.special,
  },
  {
    name: 'Brave',
    commanding: 2,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.special,
    opposite: 'Coward',
  },
  {
    name: 'Coward',
    commanding: -2,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.special,
    opposite: 'Brave',
  },
  {
    name: 'Subtle',
    commanding: 0,
    intelligence: 2,
    diplomacy: 0,
    type: TraitTypes.special,
    opposite: 'Crude',
  },
  {
    name: 'Crude',
    commanding: 0,
    intelligence: 2,
    diplomacy: 0,
    type: TraitTypes.special,
    opposite: 'Subtle',
  },
  {
    name: 'Pedantic',
    commanding: 0,
    intelligence: 0,
    diplomacy: -1,
    type: TraitTypes.special,
  },
  {
    name: 'Funny',
    commanding: 0,
    intelligence: 0,
    diplomacy: 2,
    type: TraitTypes.special,
    opposite: 'Boring',
  },
  {
    name: 'Boring',
    commanding: 0,
    intelligence: 0,
    diplomacy: 2,
    type: TraitTypes.special,
    opposite: 'Funny',
  },
]

export const traitsService = new Traits(allTraits)
