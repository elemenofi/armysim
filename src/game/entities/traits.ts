import { Officer } from './officer'
import { Rank } from './rank'
import { util } from './util'

export interface Trait {
  name: string
  intelligence: number
  commanding: number
  diplomacy: number
  type: string
}

export enum TraitTypes {
  base = 'base',
  aptitude = 'aptitude',
  looks = 'looks',
  physical = 'physical',
  childhood = 'childhood',
  teenhood = 'teenhood',
  special = 'special',
}

export class Traits {
  traits: Trait[]

  constructor (traits: Trait[]) {
    this.traits = traits
  }

  getInitialTraits (officer: Officer): Trait[] {
    return [
      this.getTraitByType(TraitTypes.childhood),
      this.getTraitByType(TraitTypes.teenhood),
      this.getTraitByType(TraitTypes.base),
    ]
  }

  getTraitByType (type: TraitTypes, traits: Trait[] = []): Trait {
    const possible = this.traits.filter((t) => {
      return t.type === type && !traits.includes(t)
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
  },
  {
    name: 'Capable',
    commanding: 1,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Talented',
    commanding: 3,
    intelligence: 3,
    diplomacy: 3,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Silly',
    commanding: -3,
    intelligence: -3,
    diplomacy: -3,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Unreliable',
    commanding: -1,
    intelligence: -1,
    diplomacy: 0,
    type: TraitTypes.aptitude,
  },
  {
    name: 'Handsome',
    commanding: 1,
    intelligence: 0,
    diplomacy: 1,
    type: 'looks',
  },
  {
    name: 'Ugly',
    commanding: -1,
    intelligence: 0,
    diplomacy: -1,
    type: TraitTypes.looks,
  },
  {
    name: 'Tall',
    commanding: 2,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.looks,
  },
  {
    name: 'Short',
    commanding: -2,
    intelligence: 2,
    diplomacy: -1,
    type: TraitTypes.looks,
  },
  {
    name: 'Fat',
    commanding: -3,
    intelligence: 0,
    diplomacy: -3,
    type: TraitTypes.looks,
  },
  {
    name: 'Strong',
    commanding: 3,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.physical,
  },
  {
    name: 'Weak',
    commanding: -3,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.physical,
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
    type: TraitTypes.teenhood,
  },
  {
    name: 'Lazy',
    commanding: -1,
    intelligence: -1,
    diplomacy: -1,
    type: TraitTypes.teenhood,
  },
  {
    name: 'Talker',
    commanding: -1,
    intelligence: 1,
    diplomacy: 1,
    type: TraitTypes.teenhood,
  },
  {
    name: 'Doer',
    commanding: 1,
    intelligence: -1,
    diplomacy: -1,
    type: TraitTypes.teenhood,
  },
  {
    name: 'Critical',
    commanding: 0,
    intelligence: 3,
    diplomacy: 0,
    type: TraitTypes.teenhood,
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
  },
  {
    name: 'Coward',
    commanding: -2,
    intelligence: 0,
    diplomacy: 0,
    type: TraitTypes.special,
  },
  {
    name: 'Subtle',
    commanding: 0,
    intelligence: 2,
    diplomacy: 0,
    type: TraitTypes.special,
  },
  {
    name: 'Crude',
    commanding: 0,
    intelligence: 2,
    diplomacy: 0,
    type: TraitTypes.special,
  },
  {
    name: 'Pedantic',
    commanding: 0,
    intelligence: 0,
    diplomacy: -1,
    type: TraitTypes.special,
  },
]

export const traitsService = new Traits(allTraits)
