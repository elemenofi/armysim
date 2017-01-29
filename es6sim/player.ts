'use strict';
import config from './config';
import Officer from './officer';

class Player extends Officer {
  constructor(spec, HQ, unitName) {
    spec.isPlayer = true;
    super(spec, HQ, unitName);
  }
}

export default Player;
