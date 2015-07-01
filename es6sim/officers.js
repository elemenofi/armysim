'use strict';
import config from './config';
import Officer from './officer';
import Secretary from './secretary';
import Player from './player';

class Officers {
  constructor () {
    this.active = [];
    this.__officersID = 1;
    this.secretary = new Secretary();
  }

  update (HQ) {
    this.active.forEach(officer => {
      officer.update(HQ);
    });
  }

  recruit (rank, unitId, isPlayer) {
    let options = {
      date: this.realDate,
      id: this.officers.__officersID,
      unitId: unitId,
      rank: rank
    };

    let cadet = (isPlayer) ? new Player(options) : new Officer(options);

    if (isPlayer) {
      cadet.graduate({
        date: config.formatDate(this.rawDate),
        unitName: this.unitName(options.unitId)
      });
    }

    this.officers.active.push(cadet);
    this.officers.__officersID++;
    return cadet;
  }

  retire () {
    this.active = this.active.filter(officer => { return !officer.retired; });
  }

  replace (replacedCommander) {
    let lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);

    let spec = {
      unitId: replacedCommander.unitId,
      rank: replacedCommander.rank.alias,
      rankToPromote: lowerRank,
      HQ: this
    };

    if (lowerRank) {
      return this.officers.candidate(spec);
    } else {
      return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
    }
  }

  replaceForPlayer (replacedCommander) {
    return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
  }

  candidate (spec) {
    let candidate = this.active
      .filter(officer => { return officer.rank.alias === spec.rankToPromote; })
      .reduce((prev, curr) => (curr.experience > prev.experience) ? curr : prev);
    return this.promote(candidate, spec);
  }

  promote (officer, spec) {
    spec.HQ.deassign(officer.unitId);
    let promotion = this.promotion(officer, spec);
    officer.history.push(config.promoted(promotion));
    officer.drifts(this.active, spec.HQ.units);
    return officer;
  }

  promotion (officer, spec) {
    officer.unitId = spec.unitId;
    officer.rank = config.ranks[spec.rank];

    return {
      rank: spec.rank,
      date: spec.HQ.realDate,
      unit: spec.HQ.unitName(officer.unitId)
    };
  }
}

export default Officers;
