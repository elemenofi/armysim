'use strict';
import config from './config';
import Officer from './officer';
import Comparisons from './comparisons';

let comparisons = new Comparisons();

class Officers {
  constructor (HQ) {
    this.active = [];
    this.HQ = HQ;
    this.__officersID = 1;
  }

  recruit (rank, unitId) {
    let date = this.HQ.realDate;
    let unitName = this.HQ.unitName(unitId);

    let options = {
      id: this.__officersID,
      date: date,
      unitId: unitId,
      unitName: unitName,  
      rank: rank 
    };

    let recruit = new Officer(options);

    this.active.push(recruit);

    this.officerID++;

    return recruit;
  }

  retire () {    
    this.active = this.active.filter(officer => {
      return !officer.retired;
    });
  }

  replace (commander) {
    let oldRank;

    switch (commander.rank.alias) {
      case 'lieutenant':
        return this.recruit('lieutenant', commander.unitId);
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

    return this.candidate(commander.unitId, commander.rank.alias, oldRank);
  }

  candidate (unitId, newRank, oldRank) {
    let candidates = []; 

    this.active.map(officer => {
      if (officer.rank.alias === oldRank) candidates.push(officer);
    });

    let candidate = candidates.sort(comparisons.byExperience)[0];

    this.HQ.deassign(candidate.unitId);

    candidate.unitId = unitId;  
    candidate.rank = config.ranks[newRank];

    let promotion = {
      rank: newRank, 
      date: this.HQ.realDate,
      unit: this.HQ.unitName(candidate.unitId) 
    };

    candidate.history.push(config.promoted(promotion));

    return candidate;
  } 

  update () {
    this.active.forEach(officer => {
      officer.update(this.active, this.HQ.units);
    });
  }
}

export default Officers;
