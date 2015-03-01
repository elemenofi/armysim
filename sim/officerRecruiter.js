var helpers = require('./helpers.js');
var Chance = require('chance');
var chance = new Chance();

var globalOfficerId = 1;

function setProfession () {
	var title = chance.prefix( {gender:"male"} );
	return (title != "Mr.") ? title + " " : "";
};

function setLastName () {
	return (helpers.randomNumber(100) >= 50) ? chance.last() : chance.last() + " " + chance.last();
};

function setFirstName () {
	return setProfession() + chance.first({ gender: "male" });
};

exports.newRecruit = function () {
	var officer = {}
	officer.lastName = setLastName();
	officer.firstName = setFirstName();
	officer.id = globalOfficerId;
	globalOfficerId++;
	return officer;
};