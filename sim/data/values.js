exports.baseIntelligence = 100;

exports.baseDrift = 1000;

exports.maxExperience = {
  ltGeneral: 70,
  dvGeneral: 60,
  bgGeneral: 50,
  coronel: 40,
  major: 30,
  captain: 20
};

exports.statusMessages = {
  duty: "in duty",
  retire: "retired",
  forcedRetire: function (plottersNames) {
    return "forced to retire by " + plottersNames.splice(" ").join(" and ");
  }
};