var _ = require('underscore');
var staffRecruiter = require('./staffRecruiter');
var unitManager = require('./unitManager');

var staff = [];

exports.initStaff = function (army) {
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
		oldUnit.commander.unitId = targetUnit.id;
		oldUnit.commander.rank = rank;
		targetUnit.commander = oldUnit.commander;
		oldUnit.commander = undefined;
		if (oldUnit.type === "battalion") {
			oldUnit.commander = recruitOfficer(army, oldUnit);
		};
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
	};
};

function retireOfficer (officer, army) {
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
				regiment.commander = undefined;
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function (brigade) {
				brigade.commander = undefined;
			});
		break;
		case "Division General":
			_.each(army.divisions, function (division) {
				division.commander = undefined;
			});
		break;
	};
	officer.retired = true;
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
		}
	});
}

exports.staff = function () {
	return staff;
};
