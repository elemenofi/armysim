var MersenneTwister = require('mersenne-twister');
var randomNumberGenerator = new MersenneTwister();

exports.randomNumber = function (range) {
	return  Math.round(randomNumberGenerator.random() * range);
};