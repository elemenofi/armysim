'use strict';
import config from './config';
import Comparisons from './comparisons';
import Officer from './officer';

let comparisons = new Comparisons();

class Officers {
  constructor () {
    this.active = [];
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
    let candidateAlias;

    switch (commander.rank.alias) {
      case 'captain':
        return this.recruit('captain', commander.unitId);
      break;
      case 'major':
        candidateAlias = 'captain';
      break;
      case 'lcoronel':
        candidateAlias = 'major';
      break;
      case 'coronel':
        candidateAlias = 'lcoronel';
      break;
      case 'bgeneral':
        candidateAlias = 'coronel';
      break;
      case 'dgeneral':
        candidateAlias = 'bgeneral';
      break;
      case 'lgeneral':
        candidateAlias = 'dgeneral';
      break;
    }

    return this.candidate(commander.unitId, commander.rank.alias, candidateAlias);
  }

  candidate (unitId, alias, candidateAlias) {
    let candidates = this.active.filter(officer => {
      return officer.rank.alias === candidateAlias;
    });

    let candidate = candidates.sort(comparisons.byExperience)[0];
    candidate.unitId = unitId;
    candidate.rank = config.ranks[alias];
    
    return candidate;
  } 

  update () {
    this.active.forEach(officer => {
      officer.update();
    });
  }
}

export default Officers;
