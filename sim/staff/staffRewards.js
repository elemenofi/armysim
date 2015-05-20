var values = require('../data/values');
var helpers = require('../utils/helpers');
var staffHistory = require('./staffHistory');
var _ = require('underscore')

function givePrestige (officer, army) {
	
	var bonusPrestige = 0;

	bonusPrestige += officer.prestige;
	bonusPrestige += helpers.randomNumber(values.prestigeTurn);
	bonusPrestige += staffHistory.checkFamily(officer, army.lastNames);
	
	if (officer.bonds.length > 0) {
		bonusPrestige += officer.bonds[officer.bonds.length - 1].strength;
	};

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

	return bonusPrestige;

};

var giveBadges = function (officer) {

	var badge = helpers.createBadge();
	officer.badges.push(badge);
	
};

exports.rewardStaff = function (army) {
	_.each(army.staff, function (officer) {

		var oldBadges = values.badgesPerPrestige(officer);

		if (officer.badges.length === 0) {

			for (var i = 0; i < oldBadges; i++) {

				giveBadges(officer);

			};
		};

		if (officer.retired === false) {

			officer.xp++;
			officer.prestige = givePrestige(officer, army);

			var newBadges = values.badgesPerPrestige(officer);

			for (var i = 0; i < (newBadges - oldBadges); i++) {
				giveBadges(officer);				
			};

		};

	});

	return army.staff;
};