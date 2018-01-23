export interface Trait {
  name: string
  area?: string
  intelligence: number
  commanding: number
  diplomacy: number
}

export class Traits {
  base: Trait[] = [
    {
      name: 'Diplomat',
      area: 'diplomacy',
      intelligence: 3,
      commanding: 2,
      diplomacy: 4,
    },
    {
      name: 'Warrior',
      area: 'commanding',
      intelligence: 2,
      commanding: 4,
      diplomacy: 1,
    },
    {
      name: 'Spy',
      area: 'intelligence',
      intelligence: 4,
      commanding: 1,
      diplomacy: 3,
    },
  ]

  cognitive: Trait[] = [
    {
      name: 'Smart',
      commanding: 2,
      intelligence: 2,
      diplomacy: 2,
    },
    {
      name: 'Slow',
      commanding: -2,
      intelligence: -2,
      diplomacy: -2,
    },
  ]

  look: Trait[] = [
    {
      name: 'Handsome',
      commanding: 1,
      intelligence: 0,
      diplomacy: 1,
    },
    {
      name: 'Ugly',
      commanding: -1,
      intelligence: 0,
      diplomacy: -1,
    },
  ]

  childhood: Trait[] = [
    {
      name: 'Mature',
      commanding: 2,
      intelligence: 0,
      diplomacy: 0,
    },
    {
      name: 'Spoiled',
      commanding: -2,
      intelligence: 0,
      diplomacy: 0,
    },
  ]

  teenhood: Trait[] = [
    {
      name: 'Ambitious',
      commanding: 1,
      intelligence: 1,
      diplomacy: 1,
    },
    {
      name: 'Lazy',
      commanding: -1,
      intelligence: -1,
      diplomacy: -1,
    },
  ]

  college: Trait[] = [
    {
      name: 'Liberal',
      commanding: -1,
      intelligence: 1,
      diplomacy: 1,
    },
    {
      name: 'Conservative',
      commanding: 1,
      intelligence: -1,
      diplomacy: -1,
    },
  ]

  special: Trait[] = [
    {
      name: 'Eccentric',
      commanding: 0,
      intelligence: 0,
      diplomacy: -2,
    },
    {
      name: 'Eloquent',
      commanding: 0,
      intelligence: 0,
      diplomacy: 2,
    },
    {
      name: 'Brave',
      commanding: 2,
      intelligence: 0,
      diplomacy: 0,
    },
    {
      name: 'Coward',
      commanding: -2,
      intelligence: 0,
      diplomacy: 0,
    },
    {
      name: 'Subtle',
      commanding: 0,
      intelligence: 2,
      diplomacy: 0,
    },
    {
      name: 'Crude',
      commanding: 0,
      intelligence: 2,
      diplomacy: 0,
    },
  ]

  random (type: string): Trait {
    let rnd = Math.round(Math.random() * this[type].length)
    if (rnd > 0) rnd--
    return this[type][rnd]
  }
}

export default Traits