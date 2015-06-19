'use strict';
const config = {
  experience () {
    return Math.round(Math.random() * 120);
  },
  unitDepth: 2,
  staffSize: 20,

  thresholds: {
    captain: 80,
    major: 100,
    retirement: 120
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
    }
  }
};

export default config;