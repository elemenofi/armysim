var helpers = require('../utils/helpers');
var _ = require('underscore')

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

function randomColor () {
		return '#'+Math.floor(Math.random()*16777215).toString(16);
};

function createBadge () {
	var badge = {};
	badge.x = helpers.randomNumber(6) + 2;
	badge.y = helpers.randomNumber(2) + 2;
	badge.bg = randomColor();
	return badge;
};

function giveBadges (officer) {
	var badge = createBadge();
	officer.badges.push(badge);
};

exports.rewardStaff = function (army) {
	_.each(army.staff, function (officer) {

		var oldBadges = Math.round(officer.prestige / 10);

		if (officer.badges.length === 0) {
			for (var i = 0; i < oldBadges; i++) {
				giveBadges(officer);				
			};
		};

		if (officer.retired === false) {
			officer.xp++;
			officer.prestige = givePrestige(officer);
			var newBadges = Math.round(officer.prestige / 10);
			for (var i = 0; i < (newBadges - oldBadges); i++) {
				giveBadges(officer);				
			};
		};
	});

	return army.staff;
};