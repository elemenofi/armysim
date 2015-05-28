var armyEngines = require('../armyEngine');
var staffRetire = require('../staff/staffRetire');
var values = require('../data/values');

var plots = function(army) {

	var activePlots = [];

	var increaseMilitancy = function (plots) {

		plots.map(function(plot) {

			var plotterA = plot[0][0];
			var plotterB = plot[0][1];
			var target = plot[1];
			var side = plot[2];
			var unit = plot[3];

			if(!target.retired) {
				if ((plotterA.prestige + plotterB.prestige) > (target.prestige * 2)) {
					plotterA.militancy++;
					plotterB.militancy++;
					if(!plotterA.plotting) {
						plotterA.history.push("Started a plot with " + plotterB.rank + " " + plotterB.lastName);
					}
					if (!plotterB.plotting) {
						plotterB.history.push("Started a plot with " + plotterA.rank + " " + plotterB.lastName);
					}
					if (
							(plotterA.militancy > 500 || plotterB.militancy > 500) && 
							((plotterA.intelligence + plotterB.intelligence) > target.intelligence)
						) {
						plotterA.completedPlot = true;
						plotterB.completedPlot = true;
						staffRetire.retireSpecificOfficer(
							target,
							army, 
							values.plotMessage.retired(
								[plotterA, plotterB]
							)
						);
						plots.splice(plots.indexOf(plot), 1);
					}; 
				};		
			};
			
		});		

	};

	var removeFailedPlots = function (plots) {

		plots.map(function(plot) {
			
			var plotterA = plot[0][0];
			var plotterB = plot[0][1];
			var target = plot[1];
			var side = plot[2];
			var unit = plot[3];
			if(!target.retired) {
				if ((plotterA.prestige + plotterB.prestige) < (target.prestige)) {
					plotterA.failedPlot = true;
					plotterB.failedPlot = true;
					plotterA.plotting = false;
					plotterB.plotting = false;
					plots.splice(plots.indexOf(plot), 1);
				};		
			};
		});

		increaseMilitancy(plots);

	};

	var findPlots = function (army, tier) {

		if (tier[1] === army) { //army special case
	
			var plotters = [];

			army.corps.map(function (corp) {
				if (corp.commander.align !== army.commander.align) {
					plotters.push(corp.commander);
				};
			});

			if (plotters.length >= 2 && !plotters[0].failedPlot && !plotters[1].failedPlot) {
				activePlots.push([plotters, army.commander, plotters[0].align, army.name]);
			}

		} else { //rest
		
			army[tier[1]].map(function (unit) {
				
				var plotters = [];
				var targetUnit = unit;
				
				unit[tier[0]].map(function (subUnit) {
				
					if (subUnit.commander.align !== unit.commander.align) {
						plotters.push(subUnit.commander);
					};
				
				});
				
				if (plotters.length >= 2) {

					if (
						plotters[0].align === plotters[1].align && 
						!plotters[0].failedPlot && 
						!plotters[1].failedPlot &&
						!plotters[0].completedPlot &&
						!plotters[1].completedPlot) {
						plotters[0].plotting = true;
						plotters[1].plotting = true;
						activePlots.push([plotters, unit.commander, plotters[0].align, targetUnit.name]);	
					};

				};
			
			});

		};

		removeFailedPlots(activePlots);

	};

	var unitAlign = function (army, units) {

		army[units].map(function (unit) {
			if (unit.commander.drift > 500) {
				unit.commander.align = "right";
				unit.align = "right";
			} else {
				unit.commander.align = "left";
				unit.align = "left";
			};
		});

	};

	var update = (function (army) {

		var unitTypes = [
			"platoons", "battalions", "companies",
			"regiments", "brigades", "divisions", 
			"corps"
		];

		var tiers = [
			[unitTypes[0], unitTypes[1]], //platoon - battalion
			[unitTypes[1], unitTypes[2]], //etc
			[unitTypes[2], unitTypes[3]],
			[unitTypes[3], unitTypes[4]],
			[unitTypes[4], unitTypes[5]],
			[unitTypes[5], unitTypes[6]],
			[unitTypes[6], army]
		];

		unitTypes.map(function (units) {
			unitAlign(army, units);
		});

		tiers.map(function (tier) {
			findPlots(army, tier);
		});

		console.log(activePlots.length);

	})(army);

};

exports.update = function (army) {
	plots(army);
};