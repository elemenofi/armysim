var helpers = require('./helpers.js');
var names = require('./names.js');
var staffManager = require('./staffManager.js')
var Chance = require('chance');
var chance = new Chance();
var armyEngine = require('./armyEngine.js');

console.log(armyEngine.army());

function setLastName () {
	var name = "";
	if (helpers.randomNumber(100) >= 85) {
		name = chance.last() + " " + chance.last();
	} else {
		name = chance.last();
	};
	return name;
};

function setFirstName () {
	var name = "";
	if (helpers.randomNumber(100) >= 90) {
		name =
			chance.first({ gender: "male" }) +
			" " +
			chance.first({ gender: "male" });
	} else {
		name = chance.first({ gender: "male" });
	}
	return name;
};

var globalOfficerId = 1;

exports.newRecruit = function (unit) {

	var officer = {}

	officer.inspecting = false;
	officer.retired = false;
	officer.bonds = [];
	officer.drift = helpers.randomNumber(1000);
	officer.lastName = setLastName();
	officer.firstName = setFirstName();
	officer.id = globalOfficerId;
	globalOfficerId++;

	switch (unit.type) {
		case "army":
			officer.prestige = helpers.randomNumber(100) + 90;
			officer.xp = helpers.randomNumber(10) + 55;
			officer.rank = names.ranks.ltGeneral;
		break;
		case "division":
			officer.prestige = helpers.randomNumber(70) + 70;
			officer.xp = helpers.randomNumber(10) + 45;
			officer.rank = names.ranks.dvGeneral;
		break;
		case "brigade":
			officer.prestige = helpers.randomNumber(50) + 50;
			officer.xp = helpers.randomNumber(10) + 35;
			officer.rank = names.ranks.bgGeneral;
		break;
		case "regiment":
			officer.prestige = helpers.randomNumber(30) + 20;
			officer.xp = helpers.randomNumber(10) + 25;
			officer.rank = names.ranks.coronel;
		break;
		case "company":
			officer.prestige = helpers.randomNumber(20) + 10;
			officer.xp = helpers.randomNumber(10) + 15;
			officer.rank = names.ranks.major;
		break;
		case "battalion":
			officer.prestige = helpers.randomNumber(10) + 1;
			officer.xp = helpers.randomNumber(10) + 5;
			officer.rank = names.ranks.captain;
		break;
	}

	var staff = staffManager.staff(armyEngine.army());
	staff.push(officer);

	return officer;
};
