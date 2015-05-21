exports.unitDepth = 2;

exports.doubleNameChance = 10;

exports.baseIntelligence = 100;

exports.baseDrift = 1000;

exports.centerDrift = 500;

exports.maxExperience = {
  general: 90,
  ltGeneral: 80,
  dvGeneral: 70,
  bgGeneral: 60,
  coronel: 50,
  ltCoronel: 40,
  major: 30,
  captain: 20
};

exports.startingExperience = {
  general: 70,
  ltGeneral: 60,
  dvGeneral: 50,
  bgGeneral: 40,
  coronel: 30,
  ltCoronel: 20,
  major: 10
};

exports.startingPrestige = {
  general: 80,
  ltGeneral: 70,
  dvGeneral: 60,
  bgGeneral: 50,
  coronel: 40,
  ltCoronel: 30,
  major: 20,
  captain: 10
};

exports.plotPrestige = function (plotter) {
  return Math.round(plotter.prestige / 2);
};

exports.prestigeHit = function (plotter) {
  return Math.round(plotter.prestige / 2);
};

exports.prestigeTurn = 25;

exports.prestigePromotion = function (officer) {
  return Math.round(officer.prestige / 20);
};

exports.badgesPerPrestige = function (officer) {
  return Math.round(officer.prestige / 10);
};

exports.statusMessages = {
  duty: "in duty",
  retire: "retired",
  forcedRetire: function (plottersNames) {
    return "forced to retire by " + plottersNames.splice(" ").join(" and ");
  }
};