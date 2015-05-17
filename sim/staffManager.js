var _ = require('underscore');
var staffRecruiter = require('./staffRecruiter');
var unitManager = require('./unitManager');

var staff = [];

exports.initStaff = function (army) {

	var officer = staffRecruiter.newRecruit(army);
	army.ltGenerals.push(officer);
	staff.push(officer);
	army.commander = officer;

	_.each(army.divisions, function (division) {
		var officer = staffRecruiter.newRecruit(division);
		army.dvGenerals.push(officer);
		division.commander = officer;
		staff.push(officer);
	});
	_.each(army.brigades, function (brigade) {
		var officer = staffRecruiter.newRecruit(brigade);
		army.bgGenerals.push(officer);
		brigade.commander = officer;
		staff.push(officer);
	});
	_.each(army.regiments, function (regiment) {
		var officer = staffRecruiter.newRecruit(regiment);
		army.coronels.push(officer);
		regiment.commander = officer;
		staff.push(officer);
	});
	_.each(army.companies, function (company) {
		var officer = staffRecruiter.newRecruit(company);
		army.majors.push(officer);
		company.commander = officer;
		staff.push(officer);
	});
	_.each(army.battalions, function (battalion) {
		var officer = staffRecruiter.newRecruit(battalion);
		army.captains.push(officer);
		battalion.commander = officer;
		staff.push(officer);
	});
	return army;
};

exports.rewardStaff = function () {
	_.each(staff, function (officer) {
		officer.xp++;
	});
};

function recruitOfficer (army, unit) {
	var officer = staffRecruiter.newRecruit(unit);
	army.captains.push(officer);
	staff.push(officer);
	return officer;
};

function promoteOfficer (rank, army, targetUnit) {
	var seniorXP = 0;

	function promote (oldUnit, rank)  {

		if (targetUnit) {
			oldUnit.commander.unitId = targetUnit.id;
			targetUnit.commander = oldUnit.commander;
		} else {
			army.commander = oldUnit.commander;
		}

		oldUnit.commander.rank = rank;
		oldUnit.commander = undefined;

		switch (oldUnit.type) {
			case "battalion":
				oldUnit.commander = recruitOfficer(army, oldUnit);
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
		}

	};

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
						army.captains.slice(army.captains.indexOf(battalion.commander), 1);
						army.majors.push(battalion.commander);
						promote(battalion, "Major");
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
						army.majors.slice(army.captains.indexOf(company.commander), 1);
						army.coronels.push(company.commander);
						promote(company, "Coronel");
					}
				}
			});
		break;
		case "Coronel":
			_.each(army.regiments, function(regiment) {
				if (regiment.parentId === targetUnit.id) {
					if (regiment.commander && regiment.commander.xp > seniorXP) {
						seniorXP = regiment.commander.xp;
					}
				}
			});
			_.each(army.regiments, function(regiment) {
				if (regiment.parentId === targetUnit.id) {
					if (regiment.commander && regiment.commander.xp === seniorXP) {
						army.coronels.slice(army.coronels.indexOf(regiment.commander), 1);
						army.bgGenerals.push(regiment.commander);
						promote(regiment, "Brigade General");
					}
				}
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function(brigade) {
				if (brigade.parentId === targetUnit.id) {
					if (brigade.commander && brigade.commander.xp > seniorXP) {
						seniorXP = brigade.commander.xp;
					}
				}
			});
			_.each(army.brigades, function(brigade) {
				if (brigade.parentId === targetUnit.id) {
					if (brigade.commander && brigade.commander.xp === seniorXP) {
						army.bgGenerals.slice(army.bgGenerals.indexOf(brigade.commander), 1);
						army.dvGenerals.push(brigade.commander);
						promote(brigade, "Division General");
					}
				}
			});
		break;
		case "Division General":
			_.each(army.divisions, function(division) {
				if (division.commander && division.commander.xp > seniorXP) {
					seniorXP = division.commander.xp;
				}
			});
			_.each(army.divisions, function(division) {
				if (division.commander && division.commander.xp === seniorXP) {
					army.dvGenerals.slice(army.dvGenerals.indexOf(division.commander), 1);
					army.ltGenerals.push(division.commander);
					promote(division, "Lieutenant General");
				}
			});
		break;
	};
};

function retireOfficer (officer, army) {

	officer.retired = true;

	switch (officer.rank) {
		case "Captain":
			_.each(army.battalions, function (battalion) {
				if (battalion.commander && battalion.commander.id === officer.id) {
					battalion.commander = undefined;
					battalion.commander = recruitOfficer(army, battalion);
				}
			});
		break;
		case "Major":
			_.each(army.companies, function (company) {
				if (company.commander && company.commander.id === officer.id) {
					company.commander = undefined;
					promoteOfficer("Captain", army, company);
				}
			});
		break;
		case "Coronel":
			_.each(army.regiments, function (regiment) {
				if (regiment.commander && regiment.commander.id === officer.id) {
					regiment.commander = undefined;
					promoteOfficer("Major", army, regiment);
				}
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function (brigade) {
				if (brigade.commander && brigade.commander.id === officer.id) {
					brigade.commander = undefined;
					promoteOfficer("Coronel", army, brigade);
				}
			});
		break;
		case "Division General":
			_.each(army.divisions, function (division) {
				if (division.commander && division.commander.id === officer.id) {
					division.commander = undefined;
					promoteOfficer("Brigade General", army, division);
				}
			});
		break;
		case "Lieutenant General":
			if (army.commander && army.commander.id === officer.id) {
				army.commander = undefined;
				promoteOfficer("Division General", army);
		}
		break;
	};

};

exports.retireStaff = function (army) {
	_.each(staff, function(officer) {
		switch (officer.rank) {
			case "Captain":
				if (officer.xp > 20) {
					retireOfficer(officer, army);
				};
			break;
			case "Major":
				if (officer.xp > 30) {
					retireOfficer(officer, army);
				};
			break;
			case "Coronel":
				if (officer.xp > 35) {
					retireOfficer(officer, army);
				};
			break;
			case "Brigade General":
				if (officer.xp > 45) {
					retireOfficer(officer, army);
				};
			break;
			case "Division General":
				if (officer.xp > 55) {
					retireOfficer(officer, army);
				};
			break;
			case "Lieutenant General":
				if (officer.xp > 75) {
					retireOfficer(officer, army);
				};
			break;
		}
	});
}

exports.staff = function () {
	return staff;
};
