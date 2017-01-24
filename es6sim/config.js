'use strict';

let gameLength = 30;

let config = {
  promoted (promotion) {
    let message =
    'Promoted to ' + this.ranks[promotion.rank].title +
    ' on ' + promotion.date + ', assigned to the ' + promotion.unit;

    return message;
  },

  graduated (graduation, officer) {
    let when = '';

    if (graduation.date && graduation.unit) {
      when = ' on ' + graduation.date + ', assigned to the ' + graduation.unit;
    }

    let message = 'Graduated from ' + officer.traits.base.school + when;
    return message;
  },

  suffix (i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
      return 'st';
    }
    if (j == 2 && k != 12) {
      return 'nd';
    }
    if (j == 3 && k != 13) {
      return 'rd';
    }
    return 'th';
  },

  formatDate (rawDate) {
    let realDate;
    realDate = rawDate.toFormat('D of MMMM, YYYY');
    // realDate = rawDate.toFormat('DDDD the D of MMMM, YYYY');
    realDate = realDate.split(' ');
    realDate[0] = rawDate.toFormat('D') + config.suffix(rawDate.toFormat('D'));
    realDate = realDate.join(' ');
    return realDate;
  },

  random (n) {
    return Math.round(Math.random() * n);
  },

  speed: 200,

  bufferTurns: 100,

  unitDepth: 2,

  staffSize: 20,

  operations: {
      commanding: {action: 'coup', area: 'commanding'},
      diplomacy: {action: 'influence', area: 'diplomacy'},
      intelligence: {action: 'spy', area: 'intelligence'}
  },

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10 * gameLength,
      maxxp: 40 * gameLength,
      startpr: 100
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40 * gameLength,
      maxxp: 60 * gameLength,
      startpr: 200
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60 * gameLength,
      maxxp: 80 * gameLength,
      startpr: 300
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80 * gameLength,
      maxxp: 100 * gameLength,
      startpr: 400
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100 * gameLength,
      maxxp: 120 * gameLength,
      startpr: 500
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120 * gameLength,
      maxxp: 140 * gameLength,
      startpr: 600
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140 * gameLength,
      maxxp: 160 * gameLength,
      startpr: 700
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160 * gameLength,
      maxxp: 180 * gameLength,
      startpr: 800
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180 * gameLength,
      maxxp: 220 * gameLength,
      startpr: 900
    }
  }
};

export default config;
