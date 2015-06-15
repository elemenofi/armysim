var values = require('../utils/values');
var helpers = require('../utils/helpers')
var recruiter = require('./recruit');
var _ = require('underscore');

var promoteOldUnitCommander = function (oldUnit, army) {
  switch (oldUnit.type) {
    case "platoon":
      oldUnit.commander = recruiter.new(oldUnit);
      army.captains.push(oldUnit.commander);
    break;

    case "battalion":
      officer("Captain", army, oldUnit);
    break;

    case "company":
      officer("Major", army, oldUnit);
    break;

    case "regiment":
      officer("Lieutenant Coronel", army, oldUnit);
    break;

    case "brigade":
      officer("Coronel", army, oldUnit);
    break;

    case "division":
      officer("Brigade General", army, oldUnit);
    break;

    case "corp":
      officer("Division General", army, oldUnit);
    break;
  };
};

var promotion = function (rank, army, oldUnit, targetUnit)  {
  var targetUnitName = '';
  
  if (targetUnit) {
    oldUnit.commander.unitId = targetUnit.id;
    targetUnit.commander = oldUnit.commander;
    targetUnitName = targetUnit.name;
  } else {
    army.commander = oldUnit.commander;
    targetUnitName = army.name;
  };

  oldUnit.commander.prestige += values.prestigePromotion(oldUnit.commander);
  oldUnit.commander.rank = rank;
  oldUnit.commander.plotting = false;

  oldUnit.commander.history.push(
    values.promotion(rank, targetUnitName, army.date)
  );

  oldUnit.commander = undefined;
  promoteOldUnitCommander(oldUnit, army);
};

var findSeniorOfficer = function (army, units, targetUnit, oldRanks, newRanks, newRank) {
  var seniorXP = 0;

  _.each(army[units], function(unit) {
    if (unit.parentId === targetUnit.id) {
      if (unit.commander && unit.commander.xp > seniorXP) {
        seniorXP = unit.commander.xp;
      };
    };
  });

  _.each(army[units], function(unit) {
    if (unit.parentId === targetUnit.id) {
      if (unit.commander && unit.commander.xp === seniorXP) {
        army[oldRanks].splice(army[oldRanks].indexOf(unit.commander), 1);

        army[newRanks].push(unit.commander);

        promotion(newRank, army, unit, targetUnit);
      };
    };
  });
};

var officer = function (rank, army, targetUnit) {
  var seniorXP = 0;

  switch (rank) {
    case "Captain":
      findSeniorOfficer(army, "platoons", targetUnit, "captains", "majors", "Major");
    break;
    case "Major":
      findSeniorOfficer(army, "battalions", targetUnit, "majors", "ltCoronels", "Lieutenant Coronel");
    break;
    case "Lieutenant Coronel":
      findSeniorOfficer(army, "companies", targetUnit, "ltCoronels", "coronels", "Coronel");
    break;
    case "Coronel":
      findSeniorOfficer(army, "regiments", targetUnit, "coronels", "bgGenerals", "Brigade General");
    break;
    case "Brigade General":
      findSeniorOfficer(army, "brigades", targetUnit, "bgGenerals", "dvGenerals", "Division General");
    break;
    case "Division General":
      findSeniorOfficer(army, "divisions", targetUnit, "dvGenerals", "ltGenerals", "Lieutenant General");
    break;
    case "Lieutenant General":
      findSeniorOfficer(army, "corps", army, "ltGenerals", "generals", "General");
    break;
  };
};

exports.promotion = promotion;
exports.officer = officer;

exports.staff = function (army) {
  return army.staff;
};
