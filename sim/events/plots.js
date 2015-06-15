var retire = require('../staff/retire');
var values = require('../utils/values');

var plots = function(army) {
	var activePlots = [];

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

	var sameAlign = function (officerA, officerB) {
		return officerA.align === officerB.align;
	};

	var findPlots = function (army, tier) {
		army[tier[1]].map(function (unit) {
			var plotters = [];
			var targetUnit = unit;

			unit[tier[0]].map(function (subUnit) {
				if (!sameAlign(unit.commander, subUnit.commander)) {
					plotters.push(subUnit.commander);
				};
			});

			// at this point if both subCommanders are of opposite align than the
			// commander, they start a plot
			if (plotters.length >= 2) {
				var newPlot = {
					plotters: plotters,
					target: unit.commander,
					unit: unit,
					strength: 0
				};

				activePlots.push(newPlot);
			};
		});
	};

	var removeFailedPlots = function (plots) {
		plots.map(function(plot) {
			if (
				!plot.plotters[0] ||
				!plot.plotters[1] ||
				!plot.target ||
				plot.plotters[0].retired ||
				plot.plotters[1].retired ||
				plot.target.retired
			) {
				plots.splice(plots.indexOf(plot), 1);
			};
		});
	};

	var updatePlots = function (plots) {
		plots.map(function (plot) {
			var plotPrestige =
			plot.plotters[0].prestige +
			plot.plotters[1].prestige;

			var plotters = [];
			plotters.push(plot.plotters[0]);
			plotters.push(plot.plotters[1]);

			if ((plot.target.prestige * 2.5) < plotPrestige) {
				retire.specificOfficer(
					plot.target, army, values.plotMessage.retired(plotters)
				);
			} else {
				plot.target.prestige -= (plotPrestige / 100);
			};
		});
	};

	var update = (function (army) {
		var unitTypes = [
			"platoons", "battalions", "companies",
			"regiments", "brigades", "divisions",
			"corps"
		];

		var unitTiers = [
			[unitTypes[0], unitTypes[1]], //platoon - battalion
			[unitTypes[1], unitTypes[2]], //etc
			[unitTypes[2], unitTypes[3]],
			[unitTypes[3], unitTypes[4]],
			[unitTypes[4], unitTypes[5]],
			[unitTypes[5], unitTypes[6]]
		];

		unitTypes.map(function (units) {
			unitAlign(army, units);
		});

		unitTiers.map(function (tier) {
			findPlots(army, tier);
		});

		removeFailedPlots(activePlots);
		updatePlots(activePlots);
	})(army);
};

exports.update = function (army) {
	plots(army);
};
