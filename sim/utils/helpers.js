var MersenneTwister = require('mersenne-twister');
var randomNumberGenerator = new MersenneTwister();
var armyEngine = require('../armyEngine');
var values = require('../data/values');
var Chance = require('chance');
var chance = new Chance();

var randomNumber = function (range) {

	return  Math.round(randomNumberGenerator.random() * range);

};

var setLastName = function () {
	
	var name = "";

	if (randomNumber(100) <= values.doubleNameChance) {

		name = chance.last() + " " + chance.last();

	} else {

		name = chance.last();

	};

	return name;

};

var setFirstName = function () {
	
	var name = "";

	if (randomNumber(100) <= values.doubleNameChance) {

		name = chance.first({ gender: "male" }) + " " +	chance.first({ gender: "male" });

	} else {

		name = chance.first({ gender: "male" });

	};

	return name;
};

var randomColor = function () {
		return '#' + Math.floor(Math.random()*16777215).toString(16);
};

var createBadge = function  () {
	var badge = {};

	badge.x = 6;
	badge.y = 3;
	badge.bg = randomColor();

	return badge;
};

exports.createBadge = createBadge;
exports.setLastName = setLastName;
exports.setFirstName = setFirstName;
exports.randomNumber = randomNumber;
