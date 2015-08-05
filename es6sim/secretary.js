'use strict';
class Secretary {
	constructor () {
		
	}

  rankLower(rank) {
    let lowerRank = null;

    switch (rank.alias) {
      case 'lieutenant':
        return lowerRank;
      case 'captain':
        lowerRank = 'lieutenant';
      break;
      case 'major':
        lowerRank = 'captain';
      break;
      case 'lcoronel':
        lowerRank = 'major';
      break;
      case 'coronel':
        lowerRank = 'lcoronel';
      break;
      case 'bgeneral':
        lowerRank = 'coronel';
      break;
      case 'dgeneral':
        lowerRank = 'bgeneral';
      break;
      case 'lgeneral':
        lowerRank = 'dgeneral';
      break;
    }

    return lowerRank;
  }
}

export default Secretary;
