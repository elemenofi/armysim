var helpers = require('../utils/helpers');
var names = require('../data/names');
var staffManager = require('./staffManager')
var armyEngine = require('../armyEngine');

var globalOfficerId = 1;

exports.newRecruit = function (unit) {

	var officer = {};

	officer.id = globalOfficerId;
	globalOfficerId++;
	officer.lastName = helpers.setLastName();
	officer.firstName = helpers.setFirstName();
	officer.retiredMessage = "in duty";
	officer.inspecting = false;
	officer.retired = false;
	officer.plotting = false;
	officer.bonds = [];
	officer.badges = [];
	officer.intelligence = helpers.randomNumber(100);
	officer.drift = helpers.randomNumber(1000);
	
	switch (unit.type) {
		case "army":
			officer.prestige = helpers.randomNumber(60);
			officer.xp = helpers.randomNumber(10) + 60;
			officer.rank = names.ranks.ltGeneral;
		break;
		case "division":
			officer.prestige = helpers.randomNumber(50);
			officer.xp = helpers.randomNumber(10) + 50;
			officer.rank = names.ranks.dvGeneral;
		break;
		case "brigade":
			officer.prestige = helpers.randomNumber(40);
			officer.xp = helpers.randomNumber(10) + 40;
			officer.rank = names.ranks.bgGeneral;
		break;
		case "regiment":
			officer.prestige = helpers.randomNumber(30);
			officer.xp = helpers.randomNumber(10) + 30;
			officer.rank = names.ranks.coronel;
		break;
		case "company":
			officer.prestige = helpers.randomNumber(20);
			officer.xp = helpers.randomNumber(10) + 20;
			officer.rank = names.ranks.major;
		break;
		case "battalion":
			officer.prestige = helpers.randomNumber(10);
			officer.xp = helpers.randomNumber(10) + 10;
			officer.rank = names.ranks.captain;
		break;
	}

	var staff = staffManager.staff(armyEngine.army());
	staff.push(officer);

	return officer;
};
