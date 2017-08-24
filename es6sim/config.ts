'use strict';
import * as moment from 'moment'

let config = {
  gameLength: 30,
  speed: 50,
  debug: true,
  // this in 10000 turns makes a better historical start,
  // 15000 makes sure all staff officers are realistically old
  bufferTurns: 12000,
  unitDepth: 2,
};

export default config;
