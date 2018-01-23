import config from './config'

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
      startxp: 10 * config.gameLength,
      maxxp: 80 * config.gameLength,
      startpr: 100,
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40 * config.gameLength,
      maxxp: 120 * config.gameLength,
      startpr: 200,
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60 * config.gameLength,
      maxxp: 160 * config.gameLength,
      startpr: 300,
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80 * config.gameLength,
      maxxp: 200 * config.gameLength,
      startpr: 400,
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100 * config.gameLength,
      maxxp: 240 * config.gameLength,
      startpr: 500,
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120 * config.gameLength,
      maxxp: 280 * config.gameLength,
      startpr: 600,
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140 * config.gameLength,
      maxxp: 320 * config.gameLength,
      startpr: 700,
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160 * config.gameLength,
      maxxp: 360 * config.gameLength,
      startpr: 800,
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180 * config.gameLength,
      maxxp: 400 * config.gameLength,
      startpr: 900,
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

export default Secretary
