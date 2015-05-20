var MersenneTwister = require('mersenne-twister');
var randomNumberGenerator = new MersenneTwister();
var Chance = require('chance');
var chance = new Chance();

var randomNumber = function (range) {
	return  Math.round(randomNumberGenerator.random() * range);
};

var setLastName = function () {
	var name = "";

	if (randomNumber(100) >= 85) {
		name = chance.last() + " " + chance.last();
	} else {
		name = chance.last();
	};

	return name;
};

var setFirstName = function () {
	
	var name = "";

	if (randomNumber(100) >= 90) {
		name = chance.first({ gender: "male" }) + " " +	chance.first({ gender: "male" });
	} else {
		name = chance.first({ gender: "male" });
	}

	return name;
};

exports.setLastName = setLastName;
exports.setFirstName = setFirstName;
exports.randomNumber = randomNumber;
