var _ = require('underscore');
var helpers = require('../utils/helpers')
var staffRecruiter = require('./staffRecruiter');
var staffPromote = require('./staffPromote');
var unitManager = require('../units/unitManager');


var retireOfficer = function (officer, army, message) {

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
					staffPromote.promoteOfficer("Captain", army, company);
				}
			});
		break;
		case "Coronel":
			_.each(army.regiments, function (regiment) {
				if (regiment.commander && regiment.commander.id === officer.id) {
					army.retired.coronels.push(regiment.commander);
					regiment.commander = undefined;
					staffPromote.promoteOfficer("Major", army, regiment);
				}
			});
		break;
		case "Brigade General":
			_.each(army.brigades, function (brigade) {
				if (brigade.commander && brigade.commander.id === officer.id) {
					army.retired.bgGenerals.push(brigade.commander);
					brigade.commander = undefined;
					staffPromote.promoteOfficer("Coronel", army, brigade);
				}
			});
		break;
		case "Division General":
			_.each(army.divisions, function (division) {
				if (division.commander && division.commander.id === officer.id) {
					army.retired.dvGenerals.push(division.commander);
					division.commander = undefined;
					staffPromote.promoteOfficer("Brigade General", army, division);
				}
			});
		break;
		case "Lieutenant General":
			if (army.commander && army.commander.id === officer.id) {
				army.retired.ltGenerals.push(army.commander);
				army.commander = undefined;
				staffPromote.promoteOfficer("Division General", army);
			};
		break;
	};

};

var retireStaff = function (army) {
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

exports.retireOfficer = retireOfficer;
exports.retireStaff = retireStaff;

exports.staff = function (army) {
	return army.staff;
};
