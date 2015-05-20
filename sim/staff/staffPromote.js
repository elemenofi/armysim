var _ = require('underscore');
var helpers = require('../utils/helpers')
var staffRecruiter = require('./staffRecruiter');
var unitManager = require('../units/unitManager');

var promotion = function (rank, army, oldUnit, targetUnit)  {

	if (targetUnit) {

		oldUnit.commander.unitId = targetUnit.id;
		targetUnit.commander = oldUnit.commander;

	} else {

		army.commander = oldUnit.commander;

	};

	oldUnit.commander.rank = rank;
	oldUnit.commander.plotting = false;
	oldUnit.commander = undefined;

	switch (oldUnit.type) {
		
		case "battalion":
			oldUnit.commander = staffRecruiter.newRecruit(oldUnit);
			army.captains.push(oldUnit.commander);
		break;
		
		case "company":
			promoteOfficer("Captain", army, oldUnit);
		break;
		
		case "regiment":
			promoteOfficer("Major", army, oldUnit);
		break;
		
		case "brigade":
			promoteOfficer("Coronel", army, oldUnit);
		break;
		
		case "division":
			promoteOfficer("Brigade General", army, oldUnit);
		break;

	};

};

var promoteOfficer = function (rank, army, targetUnit) {

	var seniorXP = 0;

	switch (rank) {
		case "Captain":
			_.each(army.battalions, function(battalion) {
				if (battalion.parentId === targetUnit.id) {
					if (battalion.commander && battalion.commander.xp > seniorXP) {
						seniorXP = battalion.commander.xp;
					}
				}
			});

			_.each(army.battalions, function(battalion) {
				if (battalion.parentId === targetUnit.id) {
					if (battalion.commander && battalion.commander.xp === seniorXP) {
						army.captains.splice(army.captains.indexOf(battalion.commander), 1);
						army.majors.push(battalion.commander);
						promotion("Major", army, battalion, targetUnit);
					}
				}
			});
		break;
		case "Major":
			_.each(army.companies, function(company) {
				if (company.parentId === targetUnit.id) {
					if (company.commander && company.commander.xp > seniorXP) {
						seniorXP = company.commander.xp;
					}
				}
			});

			_.each(army.companies, function(company) {
				if (company.parentId === targetUnit.id) {
					if (company.commander && company.commander.xp === seniorXP) {
						army.majors.splice(army.majors.indexOf(company.commander), 1);
						army.coronels.push(company.commander);
						promotion("Coronel", army, company, targetUnit);
					}
				}
			});
		break;
		case "Coronel":
			_.each(army.regiments, function(regiment) {
				if (regiment.parentId === targetUnit.id) {
					if (regiment.commander && regiment.commander.xp > seniorXP) {
						seniorXP = regiment.commander.xp;
					};
				};
			});

			_.each(army.regiments, function(regiment) {
				if (regiment.parentId === targetUnit.id) {
					if (regiment.commander && regiment.commander.xp === seniorXP) {
						army.coronels.splice(army.coronels.indexOf(regiment.commander), 1);
						army.bgGenerals.push(regiment.commander);
						promotion("Brigade General", army, regiment, targetUnit);
					};
				};
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function(brigade) {
				if (brigade.parentId === targetUnit.id) {
					if (brigade.commander && brigade.commander.xp > seniorXP) {
						seniorXP = brigade.commander.xp;
					};
				};
			});

			_.each(army.brigades, function(brigade) {
				if (brigade.parentId === targetUnit.id) {
					if (brigade.commander && brigade.commander.xp === seniorXP) {
						army.bgGenerals.splice(army.bgGenerals.indexOf(brigade.commander), 1);
						army.dvGenerals.push(brigade.commander);
						promotion("Division General", army, brigade, targetUnit);
					};
				};
			});
		break;
		case "Division General":
			_.each(army.divisions, function(division) {
				if (division.commander && division.commander.xp > seniorXP) {
					seniorXP = division.commander.xp;
				};
			});

			_.each(army.divisions, function(division) {
				if (division.commander && division.commander.xp === seniorXP) {
					army.dvGenerals.splice(army.dvGenerals.indexOf(division.commander), 1);
					army.ltGenerals.push(division.commander);
					promotion("Lieutenant General", army, division, targetUnit);
				};
			});
		break;
	};

};

exports.promotion = promotion;
exports.promoteOfficer = promoteOfficer;

exports.staff = function (army) {
	return army.staff;
};
