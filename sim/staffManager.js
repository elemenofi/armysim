var _ = require('underscore');
var officerRecruiter = require('./staffRecruiter');

var staff = [];

exports.initStaff = function (army) {
	_.each(army.divisions, function (division) {
		var officer = officerRecruiter.newRecruit(division);
		army.dvGenerals.push(officer);
		division.commander = officer;
		staff.push(officer);
	});
	_.each(army.brigades, function (brigade) {
		var officer = officerRecruiter.newRecruit(brigade);
		army.bgGenerals.push(officer);
		brigade.commander = officer;
		staff.push(officer);
	});
	_.each(army.regiments, function (regiment) {
		var officer = officerRecruiter.newRecruit(regiment);
		army.coronels.push(officer);
		regiment.commander = officer;
		staff.push(officer);
	});
	_.each(army.companies, function (company) {
		var officer = officerRecruiter.newRecruit(company);
		army.majors.push(officer);
		company.commander = officer;
		staff.push(officer);
	});
	_.each(army.battalions, function (battalion) {
		var officer = officerRecruiter.newRecruit(battalion);
		army.captains.push(officer);
		battalion.commander = officer;
		staff.push(officer);
	});
	return army;
};

exports.staff = function () {
	return staff;
};