var _ = require('underscore');
var helpers = require('../utils/helpers')
var staffRecruiter = require('./staffRecruiter');
var staffPromote = require('./staffPromote');
var staffRetire = require('./staffRetire');
var unitManager = require('../units/unitManager');

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

	initStaffByUnits("generals", army);
	initStaffByUnits("ltGenerals", "corps");
	initStaffByUnits("dvGenerals", "divisions");
	initStaffByUnits("bgGenerals", "brigades");
	initStaffByUnits("coronels", "regiments");
	initStaffByUnits("ltCoronels", "companies");
	initStaffByUnits("majors", "battalions");
	initStaffByUnits("captains", "platoons");

	return army.staff;

};

exports.inspectToggle = function (army, officer) {
	
	_.each(army.staff, function (targetOfficer) {

		if (targetOfficer.id === officer.id) {

			targetOfficer.inspecting = !targetOfficer.inspecting;

			army.inspecting.push(targetOfficer);

		};

	});

};

exports.inspectReset = function (army) {
	army.oldInspected = army.oldInspected.concat(army.inspecting);
	army.inspecting = [];
};


exports.staff = function (army) {
	return army.staff;
};
