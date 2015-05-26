var helpers = require('../utils/helpers');
var armyEngine = require('../armyEngine');
var values = require('../data/values');
var staffRetire = require('../staff/staffRetire');
var radicals = [];
var conservatives = [];

var update = function (army) {

	var mostPrestige = calculatePrestiges(army);
	var targets = [].concat(radicals);
	targets = targets.concat(conservatives);

	var removeFromFaction = function (target) {
	
		if (target.align === "conservative") {
	
			conservatives.splice(conservatives.indexOf(target), 1);
			return "radical";
	
		} else {
	
			radicals.splice(radicals.indexOf(target), 1);
			return "conservative";
	
		};
	
	};

	var terror = function (target, chance) {
	
		if (target.align !== mostPrestige && chance > 98 && !target.retired) {
	
			var faction = removeFromFaction(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, faction));
	
		} else if (target.align === mostPrestige && chance > 99 && !target.retired) {
	
			var faction = removeFromFaction(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, faction));
	
		};
	
	};

	targets.map(function(target) {

		terror(target, helpers.randomNumber(values.baseTerror));
	
	});

};

var calculatePrestiges = function () {

	var radicalPrestige = 0;
	var conservativePrestige = 0;

	radicals.map(function(radical) {

		radicalPrestige += radical.prestige;

	});

	conservatives.map(function(conservative) {

		conservativePrestige += conservative.prestige;

	});

	if (conservativePrestige > radicalPrestige) {
		
		return "conservative";

	} else {
		
		return "radical";
	
	};

};

exports.update = update;
exports.radicals = radicals;
exports.conservatives = conservatives;