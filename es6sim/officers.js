'use strict';
import config from './config';
import Comparisons from './comparisons';
import Officer from './officer';

let comparisons = new Comparisons();

class Officers {
  constructor (HQ) {
    this.active = [];
    this.HQ = HQ;
  }

  recruit (rank, unitId) {
    let recruit = new Officer(rank, unitId);

    this.active.push(recruit);

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
      case 'captain':
        return this.recruit('captain', commander.unitId);
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
    candidate.history.push(config.promoted(newRank));
    debugger;
    return candidate;
  } 

  update () {
    this.active.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;
