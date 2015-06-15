var helpers = require('../utils/helpers');

exports.unitDepth = 2;
exports.doubleNameChance = 10;
exports.baseIntelligence = 100;
exports.baseLeadership = 100;
exports.baseDrift = 1000;
exports.centerDrift = 500;
exports.radicalThreshold = 100;
exports.conservativeThreshold = 900;
exports.baseTerror = 100;
exports.prestigeTurn = 10;
exports.prestigeValedictorian = 10;

exports.maxXP = {
  general: 370,
  ltGeneral: 320,
  dvGeneral: 280,
  bgGeneral: 240,
  coronel: 200,
  ltCoronel: 160,
  major: 120,
  captain: 80
};

exports.startXP = {
  general: 369,
  ltGeneral: 60,
  dvGeneral: 50,
  bgGeneral: 40,
  coronel: 30,
  ltCoronel: 20,
  major: 10
};

exports.prestige = {
  general: 80,
  ltGeneral: 70,
  dvGeneral: 60,
  bgGeneral: 50,
  coronel: 40,
  ltCoronel: 30,
  major: 20,
  captain: 10
};

exports.status = {
  duty: "In duty",
  retire: "Retired"
};

exports.plotPrestige = function (plotter) {
  return Math.round(plotter.prestige / 100);
};
exports.prestigeHit = function (plotter) {
  return Math.round(plotter.prestige / 50);
};
exports.prestigePromotion = function (officer) {
  return Math.round(officer.prestige / 20);
};
exports.badgesPerPrestige = function (officer) {
  return Math.round(officer.prestige / 200);
};

exports.valedictorian = function (date) {
  return "Graduated valedictorian from the class of " + date;
};
exports.comission = function (unit, date) {
  return "Comissioned into " + unit.name + " on " + date;
};
exports.promotion = function (rank, unit, date) {
  return "Promoted to " + rank + " as commander of the " + unit + " on " + date;
};

exports.plot = {
  succeed: function (accomplice, target, unit, side) {
    return "";
  },
  retired: function (plotters) {
    console.log(
      "Forced to retire by " + 
      plotters[0].rank + " " + plotters[0].lastName +
      " and " + plotters[1].rank + " " + plotters[1].lastName
    );
    return 
      "Forced to retire by " + 
      plotters[0].rank + " " + plotters[0].lastName +
      " and " + plotters[1].rank + " " + plotters[1].lastName;
  }
};

exports.terror = {
  murder: function (target, faction) {
    return "Murdered by " + faction + " extremists ";
  },
  survived: function (target, date) {
    return "Survived an assasination attempt on " + date;
  },
  execute: function (target, victim, date) {
    return "Executed by martial law for the murder of " + victim + " on ";
  },
  suspect: function (suspect, target, date) {
    return "Suspected of participating in the assasination of " + target.rank + " " + target.lastName + " on " + date;
  },
  bombing: function (commander, unit, faction) {
    return "Died in the bombing of the " + unit.name + " by " + faction + " extremists";
  }
};

exports.suicide = function (officer, date) {
  return "Comitted suicide on " + date;
};
