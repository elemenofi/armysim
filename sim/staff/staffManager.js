var _ = require('underscore');
var helpers = require('../utils/helpers')
var staffRecruiter = require('./staffRecruiter');
var unitManager = require('../units/unitManager');

function promotion (rank, army, oldUnit, targetUnit)  {

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

function promoteOfficer (rank, army, targetUnit) {

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

function retireOfficer (officer, army, message) {

	officer.retired = true;
	officer.retiredMessage = message;

	switch (officer.rank) {
		case "Captain":
			_.each(army.battalions, function (battalion) {
				if (battalion.commander && battalion.commander.id === officer.id) {
					army.retired.captains.push(battalion.commander);
					battalion.commander = undefined;
					battalion.commander = staffRecruiter.newRecruit(battalion);
					army.captains.push(battalion.commander);
				};
			});
		break;
		case "Major":
			_.each(army.companies, function (company) {
				if (company.commander && company.commander.id === officer.id) {
					army.retired.majors.push(company.commander);
					company.commander = undefined;
					promoteOfficer("Captain", army, company);
				}
			});
		break;
		case "Coronel":
			_.each(army.regiments, function (regiment) {
				if (regiment.commander && regiment.commander.id === officer.id) {
					army.retired.coronels.push(regiment.commander);
					regiment.commander = undefined;
					promoteOfficer("Major", army, regiment);
				}
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function (brigade) {
				if (brigade.commander && brigade.commander.id === officer.id) {
					army.retired.bgGenerals.push(brigade.commander);
					brigade.commander = undefined;
					promoteOfficer("Coronel", army, brigade);
				}
			});
		break;
		case "Division General":
			_.each(army.divisions, function (division) {
				if (division.commander && division.commander.id === officer.id) {
					army.retired.dvGenerals.push(division.commander);
					division.commander = undefined;
					promoteOfficer("Brigade General", army, division);
				}
			});
		break;
		case "Lieutenant General":
			if (army.commander && army.commander.id === officer.id) {
				army.retired.ltGenerals.push(army.commander);
				army.commander = undefined;
				promoteOfficer("Division General", army);
			};
		break;
	};

};


exports.initStaff = function (army) {

	function assignNewOfficer (rank, unit) {

		var officer = staffRecruiter.newRecruit(unit);
		army[rank].push(officer);
		unit.commander = officer;

	};

	function initStaffByUnits (rank, units) {

		if (units === army) {

			assignNewOfficer(rank, units);
			
		} else {

			_.each(army[units], function (unit) {
				assignNewOfficer(rank, unit);
			});

		};

	};

	initStaffByUnits("ltGenerals", army);
	initStaffByUnits("dvGenerals", "divisions");
	initStaffByUnits("bgGenerals", "brigades");
	initStaffByUnits("coronels", "regiments");
	initStaffByUnits("majors", "companies");
	initStaffByUnits("captains", "battalions");

	return army.staff;

};

exports.retireStaff = function (army) {
	var message = "retired";

	_.each(army.staff, function(officer) {

		var threshold = 0;
		
		switch (officer.rank) {
			case "Captain":
				threshold = 20;
			break;
			case "Major":
				threshold = 30;
			break;
			case "Coronel":
				threshold = 40;
			break;
			case "Brigade General":
				threshold = 50;
			break;
			case "Division General":
				threshold = 60;
			break;
			case "Lieutenant General":
				threshold = 70;
			break;
		};

		if (officer.xp > threshold && officer.retired === false) {
			retireOfficer(officer, army, message);
		};

	});

};

exports.retireSpecificOfficer = function (officer, army, message) {
	retireOfficer(officer, army, message);
};

exports.inspectToggle = function (army, officer) {
	_.each(army.staff, function (targetOfficer) {
		if (targetOfficer.id === officer.id) {
			targetOfficer.inspecting = !targetOfficer.inspecting;
			army.inspecting.push(targetOfficer);
		};
	});
};

exports.staff = function (army) {
	return army.staff;
};
