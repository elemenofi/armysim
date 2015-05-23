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
	var colors = [
		"#000000",
		"#FFCB05",
		"#FFFFFF",
		"#3D3D3D",
		"#F7F7F7",
		'#722F37',
		"#C2C2C2",
		"#B4B4B4",
		"#4E4E4E"
	];
	
	return colors[Math.floor(Math.random()*colors.length)];
};
var badgeId = 1;
var createBadge = function  () {
	var badge = {};

	badge.id = badgeId;
	badge.x = 6;
	badge.y = 3;
	badge.bg = randomColor();

	badgeId++;
	
	return badge;
};

exports.createBadge = createBadge;
exports.setLastName = setLastName;
exports.setFirstName = setFirstName;
exports.randomNumber = randomNumber;
