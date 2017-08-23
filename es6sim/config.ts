'use strict';
import * as moment from 'moment'

let gameLength = 30;

let config = {
  random (n) {
    return Math.round(Math.random() * n);
  },

  speed: 50,
  debug: true,
  // this in 10000 turns makes a better historical start,
  // 15000 makes sure all staff officers are realistically old
  bufferTurns: 12000,
  
  unitDepth: 2,

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10 * gameLength,
      maxxp: 80 * gameLength,
      startpr: 100
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40 * gameLength,
      maxxp: 120 * gameLength,
      startpr: 200
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60 * gameLength,
      maxxp: 160 * gameLength,
      startpr: 300
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80 * gameLength,
      maxxp: 200 * gameLength,
      startpr: 400
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100 * gameLength,
      maxxp: 240 * gameLength,
      startpr: 500
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120 * gameLength,
      maxxp: 280 * gameLength,
      startpr: 600
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140 * gameLength,
      maxxp: 320 * gameLength,
      startpr: 700
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160 * gameLength,
      maxxp: 360 * gameLength,
      startpr: 800
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180 * gameLength,
      maxxp: 1000000 * gameLength,
      startpr: 900
    }
  }
};

export default config;
