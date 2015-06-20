'use strict';
const config = {
  experience (bonus) {
    return Math.round(Math.random() * 10 + bonus);
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
      alias: 'lieutenant'
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain'
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major'
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel'
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel'
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral'
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral'
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral'
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general'
    }
  }
};

export default config;