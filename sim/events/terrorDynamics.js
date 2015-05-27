var helpers = require('../utils/helpers');
var armyEngine = require('../armyEngine');
var values = require('../data/values');
var staffRetire = require('../staff/staffRetire');

var radicals = [];
var conservatives = [];

var update = function (army) {

	function isActive (terrorist) {
		return !terrorist.retired && !terrorist.executed && !terrorist.bombed;
	};

	radicals.filter(isActive);

	conservatives.filter(isActive);

	var mostPrestige = calculatePrestiges(army);
	var terrorists = [].concat(radicals);
	terrorists = terrorists.concat(conservatives);

	var murder = function (target) {
	
		if (target.align === "conservative") {
	
			conservatives.splice(conservatives.indexOf(target), 1);
			return "radical";
	
		} else {
	
			radicals.splice(radicals.indexOf(target), 1);
			return "conservative";
	
		};
	
	};

	var execute = function (faction, victim) {
		
		var rndIndex = helpers.randomNumber(faction.length);
		var target = faction[rndIndex];

		if (target !== undefined && !target.executed && !target.bombed && !target.retired) {

			target.executed = true;
		
			staffRetire.retireSpecificOfficer(
				target, 
				armyEngine.army(), 
				values.terrorMessage.execute(
					target, 
					victim,
					armyEngine.army().formatedDate
				)
			);		
		
		};

	};

	var suspect = function (faction, target) {

		var rndIndex = helpers.randomNumber(faction.length);
		var suspect = faction[rndIndex];

		if (suspect && suspect.suspected && !suspect.executed && !suspect.bombed) {

			suspect.executed = true;

			staffRetire.retireSpecificOfficer(
				suspect, 
				armyEngine.army(), 
				values.terrorMessage.execute(
					suspect,
					target,
					armyEngine.army().formatedDate
				)
			);

			return;

		};
		
		if (suspect !== undefined && !suspect.suspected && !suspect.executed && !suspect.bombed) {
			suspect.suspected = true;
			suspect.history.push(values.terrorMessage.suspect(suspect, target, armyEngine.army().formatedDate));
		};

	};

	var terror = function (target, chance) {
	
		if (!target.immune && target.align !== mostPrestige && chance > 50 && !target.retired) {
	
			var guiltyFaction = murder(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, guiltyFaction));
			
			if (target.align === "conservative") {
				suspect(radicals, target);
			};

		} else if (!target.immune && target.align === mostPrestige && chance > 75 && !target.retired) {
	
			var guiltyFaction = murder(target);
			staffRetire.retireSpecificOfficer(target, armyEngine.army(), values.terrorMessage.murder(target, guiltyFaction));
			
			if (target.align === "radical") {
				suspect(conservatives, target);
			};


		} else if (!target.immune) {
			
			target.immune = true;
			target.survived = true;
			target.history.push(values.terrorMessage.survived(target, armyEngine.army().formatedDate));

			if (target.align === "conservative") {
				
				execute(radicals, target.rank + " " + target.lastName);
			
			} else if (target.align === "radical") {
				
				execute(conservatives, target.rank + " " + target.lastName);

			};

		};
	
	};

	function isNotRetired (commander) {
		return !commander.retired;
	};

	var bomb = function (unit, commander, chance) {

		function bombUnitCommanders (commander, faction) {

			commander.bombed = true;

			staffRetire.retireSpecificOfficer(
				commander, 
				armyEngine.army(), 
				values.terrorMessage.bombing(
					commander,
					unit,
					faction,
					armyEngine.army().formatedDate
				)
			);
	
		};
		
		if (unit.drift === 1 && chance > 75 && commander.align === "radical" && !commander.bombed) {
			
			bombUnitCommanders(commander, "conservatives");			
			radicals.map(function(radical) {
				if (radical.rank === commander.rank && commander.id != radical.id && !radical.bombed) {
					bombUnitCommanders(radical, "conservative");
				};
			});

		} else if (unit.drift === -1 && chance > 75 && commander.align === "conservative" && !commander.bombed) {
			
			bombUnitCommanders(commander, "conservatives");			
			conservatives.map(function(conservative) {
				if (conservative.rank === commander.rank && commander.id != conservative.id && !conservative.bombed) {
					bombUnitCommanders(conservative, "radical");
				};
			});
			
		};
	
	};

	function setBomb (units) {
		
		if (units === "army") {
			return;
		}

		army[units].map(function (unit) {
			
			terrorists.filter(isNotRetired).map(function (commander) {
			
				if (unit.id === commander.unitId && !unit.bombed) {

					unit.bombed = true;
					bomb(unit, commander, helpers.randomNumber(values.baseTerror)); 

				};

			});
		
		});
	
	};	

	// console.log(armyEngine.army(), "armyy")
	setBomb("army");
	setBomb("corps");
	setBomb("divisions");
	setBomb("brigades");
	setBomb("regiments");
	setBomb("companies");
	setBomb("battalions");
	setBomb("platoons");

	terrorists.map(function(target) {

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