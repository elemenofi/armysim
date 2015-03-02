var helpers = require('./helpers.js');
var names = require('./names.js');
var Chance = require('chance');
var chance = new Chance();

var globalOfficerId = 1;

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

exports.newRecruit = function (unit) {
	var officer = {}
	officer.lastName = setLastName();
	officer.firstName = setFirstName();
	officer.id = globalOfficerId;
	officer.unitId = unit.id;
	globalOfficerId++;
	switch (unit.type) {
		case "division":
			officer.rank = names.ranks.dvGeneral;
		break;
		case "brigade":
			officer.rank = names.ranks.bgGeneral;
		break;
		case "regiment":
			officer.rank = names.ranks.coronel;
		break;
		case "company":
			officer.rank = names.ranks.major;
		break;
		case "battalion":
			officer.rank = names.ranks.captain;
		break;
	}
 	return officer;
};