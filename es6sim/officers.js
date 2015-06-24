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

    return this.candidate(commander.unitId, commander.rank.alias, oldRank, HQ);
  }

  candidate (unitId, newRank, oldRank, HQ) {
    let candidates = []; 

    this.active.map(officer => {
      if (officer.rank.alias === oldRank) candidates.push(officer);
    });

    let candidate = candidates.sort(comparisons.byExperience)[0];

    HQ.deassign(candidate.unitId);

    candidate.unitId = unitId;  
    candidate.rank = config.ranks[newRank];

    let promotion = {
      rank: newRank, 
      date: HQ.realDate,
      unit: HQ.unitName(candidate.unitId) 
    };

    candidate.history.push(config.promoted(promotion));

    return candidate;
  } 

  update (HQ) {
    this.active.forEach(officer => {
      officer.update(HQ);
    });
  }
}

export default Officers;
