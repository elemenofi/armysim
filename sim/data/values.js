exports.unitDepth = 2;

exports.doubleNameChance = 10;

exports.baseIntelligence = 100;

exports.baseDrift = 1000;

exports.centerDrift = 500;

exports.maxExperience = {
  ltGeneral: 70,
  dvGeneral: 60,
  bgGeneral: 50,
  coronel: 40,
  major: 30,
  captain: 20
};

exports.startingExperience = {
  ltGeneral: 50,
  dvGeneral: 40,
  bgGeneral: 30,
  coronel: 20,
  major: 10
};

exports.startingPrestige = {
  ltGeneral: 60,
  dvGeneral: 50,
  bgGeneral: 40,
  coronel: 30,
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