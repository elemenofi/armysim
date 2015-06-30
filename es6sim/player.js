'use strict';
import Officer from './officer';

class Player extends Officer {
  constructor(spec) {
    spec.isPlayer = true;
    super(spec);
  }
}

export default Player;
