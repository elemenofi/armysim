var _ = require('underscore');
var helpers = require('./helpers')
var staffRecruiter = require('./staffRecruiter');
var unitManager = require('./unitManager');

function recruitCaptain (unit) {
	var officer = staffRecruiter.newRecruit(unit);
	return officer;
};

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
			oldUnit.commander = recruitCaptain(oldUnit);
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
					battalion.commander = recruitCaptain(battalion);
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

function givePrestige (officer) {
	
	var bonusPrestige = 0;
	bonusPrestige += officer.prestige;
	bonusPrestige += helpers.randomNumber(25);
	// switch (officer.rank) {
	// 	case "Captain":
	// 		bonusPrestige += helpers.randomNumber(10);
	// 	break;
	// 	case "Major":
	// 		bonusPrestige += helpers.randomNumber(12);
	// 	break;
	// 	case "Coronel":
	// 		bonusPrestige += helpers.randomNumber(15);
	// 	break;
	// 	case "Brigade General":
	// 		bonusPrestige += helpers.randomNumber(17);
	// 	break;
	// 	case "Division General":
	// 		bonusPrestige += helpers.randomNumber(20);
	// 	break;
	// 	case "Lieutenant General":
	// 		bonusPrestige += helpers.randomNumber(25);
	// 	break;
	// }

	// if (officer.bonds.length > 0) {
	// 	bonusPrestige += officer.bonds[officer.bonds.length - 1].strength;
	// };

	return bonusPrestige;

};

exports.initStaff = function (army) {

	var officer = staffRecruiter.newRecruit(army);
	army.ltGenerals.push(officer);
	army.commander = officer;

	_.each(army.divisions, function (division) {
		var officer = staffRecruiter.newRecruit(division);
		army.dvGenerals.push(officer);
		division.commander = officer;
	});
	_.each(army.brigades, function (brigade) {
		var officer = staffRecruiter.newRecruit(brigade);
		army.bgGenerals.push(officer);
		brigade.commander = officer;
	});
	_.each(army.regiments, function (regiment) {
		var officer = staffRecruiter.newRecruit(regiment);
		army.coronels.push(officer);
		regiment.commander = officer;
	});
	_.each(army.companies, function (company) {
		var officer = staffRecruiter.newRecruit(company);
		army.majors.push(officer);
		company.commander = officer;
	});
	_.each(army.battalions, function (battalion) {
		var officer = staffRecruiter.newRecruit(battalion);
		army.captains.push(officer);
		battalion.commander = officer;
	});

	return army.staff;

};

exports.rewardStaff = function (army) {

	_.each(army.staff, function (officer) {
		if (officer.retired === false) {
			officer.xp++;
			officer.prestige = givePrestige(officer);
		};
	});

	return army.staff;
};

exports.retireStaff = function (army) {
	var message = "retired";

	_.each(army.staff, function(officer) {
		switch (officer.rank) {
			case "Captain":
				if (officer.xp > 20 && officer.retired === false) {
					retireOfficer(officer, army, message);
				};
			break;
			case "Major":
				if (officer.xp > 30 && officer.retired === false) {
					retireOfficer(officer, army, message);
				};
			break;
			case "Coronel":
				if (officer.xp > 40 && officer.retired === false) {
					retireOfficer(officer, army, message);
				};
			break;
			case "Brigade General":
				if (officer.xp > 50 && officer.retired === false) {
					retireOfficer(officer, army, message);
				};
			break;
			case "Division General":
				if (officer.xp > 60 && officer.retired === false) {
					retireOfficer(officer, army, message);
				};
			break;
			case "Lieutenant General":
				if (officer.xp > 70 && army.commander === officer) {
					retireOfficer(officer, army, message);
				};
			break;
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
		};
	});
};

exports.staff = function (army) {
	return army.staff;
};
