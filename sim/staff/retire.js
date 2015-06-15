var helpers = require('../utils/helpers');
var values = require('../utils/values');
var recruiter = require('./recruit');
var promote = require('./promote');
var _ = require('underscore');

var retirement = function (army, units, officer, retiredRank, promoteRank) {
	_.each(army[units], function (unit) {
		if (unit.commander && unit.commander.id === officer.id) {
			army.retired[retiredRank].push(unit.commander);
			unit.commander = undefined;
			promote.officer(promoteRank, army, unit);
		};
	});
};

var retireOfficer = function (officer, army, message) {
	officer.retired = true;
	officer.statusMessage = message;
	officer.history.push(message + " on " + army.formatedDate);
	
	switch (officer.rank) {
		case "Captain":
			_.each(army.platoons, function (platoon) {
				if (platoon.commander && platoon.commander.id === officer.id) {
					army.retired.captains.push(platoon.commander);
					platoon.commander = undefined;
					platoon.commander = recruiter.new(platoon);
					army.captains.push(platoon.commander);
				};
			});
		break;

		case "Major":
			retirement(army, "battalions", officer, "majors", "Captain");
		break;

		case "Lieutenant Coronel":
			retirement(army, "companies", officer, "ltCoronels", "Major");
		break;

		case "Coronel":
			retirement(army, "regiments", officer, "coronels", "Lieutenant Coronel");
		break;

		case "Brigade General":
			retirement(army, "brigades", officer, "bgGenerals", "Coronel");
		break;

		case "Division General":
			retirement(army, "divisions", officer, "dvGenerals", "Brigade General");
		break;

		case "Lieutenant General":
			retirement(army, "corps", officer, "ltGenerals", "Division General");
		break;

		case "General":
			if (army.commander && army.commander.id === officer.id) {
				army.retired.generals.push(army.commander);
				army.commander = undefined;
				promote.officer("Lieutenant General", army);
			};
		break;
	};
};

var update = function (army) {
	var message = values.statusMessage.retire;
	_.each(army.staff, function(officer) {
		if (officer) {
			var threshold = 0;

			switch (officer.rank) {
				case "Captain":
					threshold = values.maxExperience.captain;
				break;
				
				case "Major":
					threshold = values.maxExperience.major;
				break;
				
				case "Coronel":
					threshold = values.maxExperience.coronel;
				break;
				
				case "Lieutenant Coronel":
					threshold = values.maxExperience.coronel;
				break;
				
				case "Brigade General":
					threshold = values.maxExperience.bgGeneral;
				break;

				case "Division General":
					threshold = values.maxExperience.dvGeneral;
				break;

				case "Lieutenant General":
					threshold = values.maxExperience.ltGeneral;
				break;

				case "General":
					threshold = values.maxExperience.ltGeneral;
				break;
			};

			if (officer.xp > threshold && officer.retired === false) {
				retireOfficer(officer, army, message);
				army.staff.splice(army.staff.indexOf(officer), 1);
			};
		};
	});
};

exports.specificOfficer = function (officer, army, message) {
	retireOfficer(officer, army, message);
};

exports.retireOfficer = retireOfficer;
exports.update = update;

exports.staff = function (army) {
	return army.staff;
};
