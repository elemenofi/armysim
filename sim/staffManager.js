var _ = require('underscore');
var names = require('./names.js');
var officerRecruiter = require('./officerRecruiter');

exports.initStaff = function (army) {
	_.each(army.divisions, function (division) {
		var officer = officerRecruiter.newRecruit();
		officer.rank = names.ranks[4];
		officer.unitId = division.id;
		army.dvGenerals.push(officer);
		division.commander = officer;
	});
	_.each(army.brigades, function (brigade) {
		var officer = officerRecruiter.newRecruit();
		officer.rank = names.ranks[3];
		officer.unitId = brigade.id;
		army.bgGenerals.push(officer);
		brigade.commander = officer;
	});
	_.each(army.regiments, function (regiment) {
		var officer = officerRecruiter.newRecruit();
		officer.rank = names.ranks[2];
		officer.unitId = regiment.id;
		army.coronels.push(officer);
		regiment.commander = officer;
	});
	_.each(army.companies, function (company) {
		var officer = officerRecruiter.newRecruit();
		officer.rank = names.ranks[1];
		officer.unitId = company.id;
		army.majors.push(officer);
		company.commander = officer;
	});
	_.each(army.battalions, function (battalion) {
		var officer = officerRecruiter.newRecruit();
		officer.rank = names.ranks[0];
		officer.unitId = battalion.id;
		army.captains.push(officer);
		battalion.commander = officer;
	});
	return army;
};