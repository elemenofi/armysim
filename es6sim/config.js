'use strict';

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
    realDate = rawDate.toFormat('DDDD the D of MMMM, YYYY');
    realDate = realDate.split(' ');
    realDate[2] = rawDate.toFormat('D') + config.suffix(rawDate.toFormat('D'));
    realDate = realDate.join(' ');
    return realDate;
  },

  random (n) {
    return Math.round(Math.random() * n);
  },

  speed: 1500,

  unitDepth: 2,

  staffSize: 20,

  operations: {
      administration: {action: 'deviate', area: 'administration'},
      commanding: {action: 'coup', area: 'commanding'},
      diplomacy: {action: 'influence', area: 'diplomacy'},
      intelligence: {action: 'spy', area: 'intelligence'}
  },

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10,
      maxxp: 40,
      startpr: 100
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40,
      maxxp: 60,
      startpr: 200
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60,
      maxxp: 80,
      startpr: 300
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80,
      maxxp: 100,
      startpr: 400
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100,
      maxxp: 120,
      startpr: 500
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120,
      maxxp: 140,
      startpr: 600
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140,
      maxxp: 160,
      startpr: 700
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160,
      maxxp: 180,
      startpr: 800
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180,
      maxxp: 220,
      startpr: 900
    }
  }
};

export default config;
