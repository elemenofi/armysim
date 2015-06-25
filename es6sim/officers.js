'use strict';
import config from './config';
import Officer from './officer';
import Comparisons from './comparisons';

let comparisons = new Comparisons();

class Officers {
  constructor () {
    this.active = [];
    this.__officersID = 1;
  }

  recruit (rank, unitId, HQ) {
    let date = HQ.realDate;
    let unitName = HQ.unitName(unitId);

    let options = {
      id: this.__officersID,
      date: date,
      unitId: unitId,
      unitName: unitName,  
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
    let oldRank;

    switch (commander.rank.alias) {
      case 'lieutenant':
        return this.recruit('lieutenant', commander.unitId, HQ);
      case 'captain':
        oldRank = 'lieutenant';
      break;
      case 'major':
        oldRank = 'captain';
      break;
      case 'lcoronel':
        oldRank = 'major';
      break;
      case 'coronel':
        oldRank = 'lcoronel';
      break;
      case 'bgeneral':
        oldRank = 'coronel';
      break;
      case 'dgeneral':
        oldRank = 'bgeneral';
      break;
      case 'lgeneral':
        oldRank = 'dgeneral';
      break;
    }

    let spec = {
      unitId: commander.unitId,
      rank: commander.rank.alias,
      rankToPromote: oldRank,
      HQ: HQ
    };

    return this.candidate(spec);
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
    return {
      rank: spec.rank,
      date: spec.HQ.realDate,
      unit: spec.HQ.unitName(officer.unitId)
    };
  }

  promote (officer, spec) {
    spec.HQ.deassign(officer.unitId);

    officer.unitId = spec.unitId;  
    officer.rank = config.ranks[spec.rank];

    let promotion = this.promotion(officer, spec);

    officer.history.push(config.promoted(promotion));
    officer.drifts(this.active, spec.HQ.units);

    return officer;
  }

  

  update (HQ) {
    this.active.forEach(officer => {
      officer.update(HQ);
    });
  }
}

export default Officers;
