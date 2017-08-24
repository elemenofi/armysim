
export interface Trait {
  name: string
  area: string
  intelligence: number
  commanding: number
  diplomacy: number
}

export class Traits {
  base: Trait[]

  constructor () {
    this.base = [
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
  }

  random (base: string) {
    const rnd = Math.round(Math.random() * 2)
    return this.base[rnd]
  }
}

export default Traits
