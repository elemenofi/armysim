export interface School {
  name: string
}

class Secretary {
  schools: { [key: string]: School; } = {
    diplomacy: {
      name: 'National Officer Candidate School',
    },
    commanding: {
      name: 'National Military Academy',
    },
    intelligence: {
      name: 'National Institute of Military Intelligence',
    },
  }

  ranks = {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startpr: 200,
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
    },
  }

  rankLower (rank) {
    let lowerRank

    switch (rank.alias) {
      case 'lieutenant':
        return lowerRank
      case 'captain':
        lowerRank = 'lieutenant'
      break
      case 'major':
        lowerRank = 'captain'
      break
      case 'lcoronel':
        lowerRank = 'major'
      break
      case 'coronel':
        lowerRank = 'lcoronel'
      break
      case 'bgeneral':
        lowerRank = 'coronel'
      break
      case 'dgeneral':
        lowerRank = 'bgeneral'
      break
      case 'lgeneral':
        lowerRank = 'dgeneral'
      break
      case 'general':
        lowerRank = 'lgeneral'
      break
    }

    return lowerRank
  }
}


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

// export default Traits

export default Secretary
