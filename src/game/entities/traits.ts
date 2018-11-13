import { util } from './util'

export interface Trait {
  name: string
  opposite?: string
  type: string
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
    type: TraitTypes.base
  },
  {
    name: 'Warrior',
    type: TraitTypes.base,
  },
  {
    name: 'Spy',
    type: TraitTypes.base,
  },
  {
    name: 'Smart',
    type: TraitTypes.aptitude,
  },
  {
    name: 'Slow',
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Capable',
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Talented',
    type: TraitTypes.aptitude,
    opposite: 'Slow',
  },
  {
    name: 'Silly',
    type: TraitTypes.aptitude,
    opposite: 'Capable',
  },
  {
    name: 'Unreliable',
    type: TraitTypes.aptitude,
    opposite: 'Smart',
  },
  {
    name: 'Handsome',
    type: TraitTypes.physical,
    opposite: 'Ugly',
  },
  {
    name: 'Ugly',
    type: TraitTypes.physical,
    opposite: 'Handsome',
  },
  {
    name: 'Tall',
    type: TraitTypes.physical,
    opposite: 'Short',
  },
  {
    name: 'Short',
    type: TraitTypes.physical,
    opposite: 'Tall',
  },
  {
    name: 'Fat',
    type: TraitTypes.physical,
  },
  {
    name: 'Strong',
    type: TraitTypes.physical,
    opposite: 'Weak',
  },
  {
    name: 'Weak',
    type: TraitTypes.physical,
    opposite: 'Strong',
  },
  {
    name: 'Responsible',
    type: TraitTypes.childhood,
  },
  {
    name: 'Spoiled',
    type: TraitTypes.childhood,
  },
  {
    name: 'Charismatic',
    type: TraitTypes.childhood,
  },
  {
    name: 'Bully',
    type: TraitTypes.childhood,
  },
  {
    name: 'Urchin',
    type: TraitTypes.childhood,
  },
  {
    name: 'Ambitious',
    type: TraitTypes.special,
  },
  {
    name: 'Lazy',
    type: TraitTypes.special,
    opposite: 'Diligent',
  },
  {
    name: 'Diligent',
    type: TraitTypes.special,
    opposite: 'Lazy',
  },
  {
    name: 'Eccentric',
    type: TraitTypes.special,
  },
  {
    name: 'Eloquent',
    type: TraitTypes.special,
  },
  {
    name: 'Brave',
    type: TraitTypes.special,
    opposite: 'Coward',
  },
  {
    name: 'Coward',
    type: TraitTypes.special,
    opposite: 'Brave',
  },
  {
    name: 'Subtle',
    type: TraitTypes.special,
    opposite: 'Crude',
  },
  {
    name: 'Crude',
    type: TraitTypes.special,
    opposite: 'Subtle',
  },
  {
    name: 'Pedantic',
    type: TraitTypes.special,
  },
  {
    name: 'Funny',
    type: TraitTypes.special,
    opposite: 'Boring',
  },
  {
    name: 'Boring',
    type: TraitTypes.special,
    opposite: 'Funny',
  },
]

export const traitsService = new Traits(allTraits)
