var helpers = require('../utils/helpers');
var names = require('../data/names');
var values = require('../data/values')
var staffManager = require('./staffManager')
var armyEngine = require('../armyEngine');

var globalOfficerId = 1;
var generationBatch = []; 
var lastBatch = '';

exports.newRecruit = function (unit) {

	var officer = {};

	officer.id = globalOfficerId;
	globalOfficerId++;

	officer.generation = armyEngine.army().date.getYear();
	officer.history = [].concat(officer.history);

	officer.lastName = helpers.setLastName();
	officer.firstName = helpers.setFirstName();
	officer.statusMessage = values.statusMessage.duty;

	officer.inspecting = false;
	officer.retired = false;
	officer.plotting = false;

	officer.bonds = [];
	officer.badges = [];

	officer.intelligence = helpers.randomNumber(values.baseIntelligence);
	officer.leadership = helpers.randomNumber(values.baseLeadership);
	officer.drift = helpers.randomNumber(values.baseDrift);

	generationBatch.push(officer);

	if ((unit.type === "platoon") && (generationBatch.length >= 20) && (armyEngine.army().date.toFormat("YYYY") !== lastBatch)) {

		function compare (a, b) {

		  if (a.intelligence < b.intelligence)

		    return -1;

		  if (a.intelligence > b.intelligence)

		    return 1;

		  return 0;

		}

		generationBatch.sort(compare);

	 	generationBatch[generationBatch.indexOf(officer)].history.push(
	 		values.valedictorianMessage.valedictorian(armyEngine.army().date.toFormat("YYYY")-1)
	 	);

		generationBatch[generationBatch.indexOf(officer)].history.push(
			values.comissionMessage.comission(unit, armyEngine.army().formatedDate)
		);

		generationBatch[generationBatch.indexOf(officer)].valedictorian = true;

		lastBatch = armyEngine.army().date.toFormat("YYYY");
		generationBatch = [];

	} else if (unit.type === "platoon") {

		officer.history.push(values.comissionMessage.comission(unit, armyEngine.army().formatedDate));

	};

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
	armyEngine.lastNames().push(lastNameRecord);

	var staff = staffManager.staff(armyEngine.army());
	staff.push(officer);

	return officer;
	
};
