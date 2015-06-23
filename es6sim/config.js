'use strict';

let config = {
  promoted (rank, date, unit) {
    let message = 'Promoted to ' + this.ranks[rank].title + ' on ' + date + ', assigned to the ' + unit;
    return message;
  },

  suffix (i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
      return "st";
    }
    if (j == 2 && k != 12) {
      return "nd";
    }
    if (j == 3 && k != 13) {
      return "rd";
    }
    return "th";
  },

  formatDate (rawDate) {
    let realDate;
    realDate = rawDate.toFormat("DDDD the D of MMMM, YYYY");
    realDate = realDate.split(" ");
    realDate[2] = rawDate.toFormat("D") + config.suffix(rawDate.toFormat("D"));
    realDate = realDate.join(" ");
    return realDate;
  },

  days () {
    return Math.round(Math.random() * 150);
  },

  experience () {
    return Math.round(Math.random() * 10);
  },

  unitDepth: 2,
  staffSize: 20,

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10,
      maxxp: 40
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40,
      maxxp: 60
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60,
      maxxp: 80
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80,
      maxxp: 100
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100,
      maxxp: 120
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120,
      maxxp: 140
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140,
      maxxp: 160
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160,
      maxxp: 180
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180,
      maxxp: 220
    }
  }
};

export default config;