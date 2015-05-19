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


exports.rewardStaff = function (army) {

	_.each(army.staff, function (officer) {
		if (officer.retired === false) {
			officer.xp++;
			officer.prestige = givePrestige(officer);
		};
	});

	return army.staff;
};