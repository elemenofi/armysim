var helpers = require('../utils/helpers');
var names = require('../data/names');
var values = require('../data/values')
var staffManager = require('./staffManager')
var armyEngine = require('../armyEngine');

var globalOfficerId = 1;

exports.newRecruit = function (unit) {

	var officer = {};

	officer.id = globalOfficerId;
	globalOfficerId++;
	officer.lastName = helpers.setLastName();
	officer.firstName = helpers.setFirstName();
	officer.statusMessage = values.statusMessages.duty;
	officer.inspecting = false;
	officer.retired = false;
	officer.plotting = false;
	officer.bonds = [];
	officer.badges = [];
	officer.intelligence = helpers.randomNumber(values.baseIntelligence);
	officer.drift = helpers.randomNumber(values.baseDrift);
	
	switch (unit.type) {
		case "army":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.general;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.general;
			officer.rank = names.ranks.general;
		break;
		case "corp":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.ltGeneral;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.ltGeneral;
			officer.rank = names.ranks.ltGeneral;
		break;
		case "division":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.dvGeneral;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.dvGeneral;;
			officer.rank = names.ranks.dvGeneral;
		break;
		case "brigade":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.bgGeneral;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.bgGeneral;;
			officer.rank = names.ranks.bgGeneral;
		break;
		case "regiment":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.coronel;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.coronel;;
			officer.rank = names.ranks.coronel;
		break;
		case "company":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.ltCoronel;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.ltCoronel;;
			officer.rank = names.ranks.ltCoronel;
		break;
		case "battalion":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.major;
			officer.xp = helpers.randomNumber(10) + values.startingExperience.major;
			officer.rank = names.ranks.major;
		break;
		case "platoon":
			officer.prestige = helpers.randomNumber(10) + values.startingPrestige.captain;
			officer.xp = 10;
			officer.rank = names.ranks.captain;
		break;
	};

	var lastNameRecord = {id: officer.id, lastName: officer.lastName};
	armyEngine.army().lastNames.push(lastNameRecord);

	var staff = staffManager.staff(armyEngine.army());
	staff.push(officer);

	return officer;
};
