'use strict';
import config from './config';
import Officer from './officer';

class Player extends Officer {
  constructor(spec, HQ) {
    spec.isPlayer = true;
    super(spec);
    this.graduate({
      date: config.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId)
    });
  }
}

export default Player;
