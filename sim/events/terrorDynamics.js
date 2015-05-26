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

	var execute = function (faction) {
		
		var rndIndex = helpers.randomNumber(faction.length);
		var target = faction[rndIndex];


		if (target !== undefined) {
		
			staffRetire.retireSpecificOfficer(
				target, 
				armyEngine.army(), 
				values.terrorMessage.execute(
					target, 
					armyEngine.army().formatedDate
				)
			);		
		
		};

	};

	var suspect = function (faction, target) {

		var rndIndex = helpers.randomNumber(faction.length);
		var suspect = faction[rndIndex];

		if (suspect && suspect.suspected) {
		
			staffRetire.retireSpecificOfficer(
				suspect, 
				armyEngine.army(), 
				values.terrorMessage.execute(
					suspect, 
					armyEngine.army().formatedDate
				)
			);

			return;

		};
		
		if (suspect !== undefined && !suspect.suspected) {
			suspect.suspected = true;
			console.log(suspect.lastName, "authoringggggggggggggggggggggggggggggggg");
			suspect.history.push(values.terrorMessage.suspect(suspect, target, armyEngine.army().formatedDate));
		};

	};

	var terror = function (target, chance) {
	
		if (!target.immune && target.align !== mostPrestige && chance > 50 && !target.retired) {
	
			var faction = removeFromFaction(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, faction));
			
			console.log("faction to suspect", faction);
			if (target.align === "conservative") {
				suspect(radicals, target);
			};

		} else if (!target.immune && target.align === mostPrestige && chance > 75 && !target.retired) {
	
			var faction = removeFromFaction(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, faction));
			
			console.log("faction to suspect", faction);
			if (target.align === "radical") {
				suspect(conservatives, target);
			};


		} else if (!target.immune) {
			
			target.immune = true;
			target.survived = true;
			target.history.push(values.terrorMessage.survived(target, armyEngine.army().formatedDate));

			if (target.align === "conservative") {
				
				execute(radicals);
			
			} else if (target.align === "radical") {
				
				execute(conservatives);

			};

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