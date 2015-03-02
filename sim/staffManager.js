var _ = require('underscore');
var staffRecruiter = require('./staffRecruiter');

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

exports.retireStaff = function () {

};

exports.staff = function () {
	return staff;
};