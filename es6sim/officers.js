'use strict';
import config from './config';
import Officer from './officer';
import Comparisons from './comparisons';
import Secretary from './secretary';

let comparisons = new Comparisons();

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

  recruit (rank, unitId, HQ) {
    let options = {
      date: HQ.realDate,
      unitName: HQ.unitName(unitId),
      id: this.__officersID,
      unitId: unitId,
      rank: rank
    };

    let recruit = new Officer(options);
    this.active.push(recruit);
    this.__officersID++;
    return recruit;
  }

  retire () {
    this.active = this.active.filter(officer => {
      return !officer.retired;
    });
  }

  replace (commander, HQ) {
    let lowerRank = this.secretary.rankLower(commander.rank);

    let spec = {
      unitId: commander.unitId,
      rank: commander.rank.alias,
      rankToPromote: lowerRank,
      HQ: HQ
    };

    if (!lowerRank) {
      return this.recruit('lieutenant', commander.unitId, HQ);
    } else {
      return this.candidate(spec);
    }
  }

  candidate (spec) {
    let candidates = [];

    this.active.map(officer => {
      if (officer.rank.alias === spec.rankToPromote) {
        candidates.push(officer);
      }
    });

    let candidate = candidates.sort(comparisons.byExperience)[0];

    return this.promote(candidate, spec);
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

  promote (officer, spec) {
    spec.HQ.deassign(officer.unitId);

    let promotion = this.promotion(officer, spec);

    officer.history.push(config.promoted(promotion));
    officer.drifts(this.active, spec.HQ.units);

    return officer;
  }

}

export default Officers;
