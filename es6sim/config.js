'use strict';
const config = {
  experience () {
    return Math.round(Math.random() * 10);
  },

  unitDepth: 2,
  staffSize: 20,

  thresholds: {
    lieutenant: 20,
    captain: 40,
    major: 60,
    lcoronel: 80,
    coronel: 100,
    bgeneral: 120,
    dgeneral: 140,
    lgeneral: 160,
    general: 180,
    retirement: 220
  },

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180
    }
  }
};

export default config;