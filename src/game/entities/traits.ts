import { util } from './util'

export interface Trait {
  name: string
  opposite?: string
  type: string
  field?: number
  intelligence?: number
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

  getInitialTraits (): Trait[] {
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
    type: TraitTypes.base,
    intelligence: 2,
    field: 1,
  },
  {
    name: 'Strategist',
    type: TraitTypes.base,
    intelligence: 1,
    field: 3,
  },
  {
    name: 'Spy',
    type: TraitTypes.base,
    intelligence: 3,
    field: 2,
  },
  {
    name: 'Inspector',
    type: TraitTypes.base,
  },
  {
    name: 'Administrator',
    type: TraitTypes.base,
  },
  {
    name: 'Technologist',
    type: TraitTypes.base,
  },
  {
    name: 'Coordinator',
    type: TraitTypes.base,
  },
  {
    name: 'Adoctrinator',
    type: TraitTypes.base,
  },
  {
    name: 'Smart',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Slow',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 1,
    opposite: 'Capable',
  },
  {
    name: 'Capable',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 2,
  },
  {
    name: 'Talented',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 3,
    opposite: 'Slow',
  },
  {
    name: 'Silly',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 1,
    opposite: 'Capable',
  },
  {
    name: 'Unreliable',
    type: TraitTypes.aptitude,
    intelligence: 1,
    field: 1,
    opposite: 'Smart',
  },
  {
    name: 'Handsome',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Ugly',
  },
  {
    name: 'Ugly',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Handsome',
  },
  {
    name: 'Tall',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Short',
  },
  {
    name: 'Short',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Tall',
  },
  {
    name: 'Fat',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Strong',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Weak',
  },
  {
    name: 'Weak',
    type: TraitTypes.physical,
    intelligence: 1,
    field: 1,
    opposite: 'Strong',
  },
  {
    name: 'Responsible',
    type: TraitTypes.childhood,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Spoiled',
    type: TraitTypes.childhood,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Charismatic',
    type: TraitTypes.childhood,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Bully',
    type: TraitTypes.childhood,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Urchin',
    type: TraitTypes.childhood,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Ambitious',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Lazy',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Diligent',
  },
  {
    name: 'Diligent',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Lazy',
  },
  {
    name: 'Eccentric',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Eloquent',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Brave',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Coward',
  },
  {
    name: 'Coward',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Brave',
  },
  {
    name: 'Subtle',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Crude',
  },
  {
    name: 'Crude',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Subtle',
  },
  {
    name: 'Pedantic',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
  },
  {
    name: 'Funny',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Boring',
  },
  {
    name: 'Boring',
    type: TraitTypes.special,
    intelligence: 1,
    field: 1,
    opposite: 'Funny',
  },
]

export const traitsService = new Traits(allTraits)
