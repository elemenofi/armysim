var retire = require('../staff/retire');
var values = require('../utils/values');

var update = function (army) {
  var activePlots = [];

  var aligned = function (officerA, officerB) {
    return officerA.align === officerB.align;
  };

  var align = function (army, units) {
    army[units].map(function (unit) {
      if (unit.commander.drift > 500) {
        unit.commander.align = 'right';
        unit.align = 'right';
      } else {
        unit.commander.align = 'left';
        unit.align = 'left';
      };
    });
  };

  var start = function (army, tier) {
    army[tier[1]].map(function (unit) {
      var plotters = [];
      var targetUnit = unit;

      unit[tier[0]].map(function (subUnit) {
        if (!aligned(unit.commander, subUnit.commander)) {
          plotters.push(subUnit.commander);
        };
      });

      if (plotters.length >= 2) {
        var newPlot = {
          plotters: plotters,
          target: unit.commander,
          unit: unit,
        };

        // validate plots
        plotters.forEach(function(plotter){
          plotter.plots.forEach(function(plot) {
            if (plot === newPlot.target.id) plotter.hadPlot = true;
          });

          if (!plotter.hadPlot) {
            plotter.plots.push(newPlot.target.id);
            plotter.history.push(values.plot.start(newPlot, army.date));
          }
        });

        activePlots.push(newPlot);
      };
    });
  };

  var remove = function (plots) {
    plots.map(function (plot) {
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

  var advance = function (plots) {
    plots.map(function (plot) {
      var plotters = plot.plotters;
      var plotPrestige = plotters[0].prestige + plotters[1].prestige;
      
      if ((plot.target.prestige * 2.5) < plotPrestige) {
        plotters.forEach(function (plotter) {
          plotter.history.push(values.plot.succeed(plot, army.date));
        });
        
        retire.specific(plot.target, army, values.plot.retired(plotters));
      } else {
        plot.target.prestige -= (plotPrestige / 100);
      };
    });

  };

  var unitTypes = [
    'platoons', 'battalions', 'companies',
    'regiments', 'brigades', 'divisions',
    'corps'
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
    align(army, units);
  });

  unitTiers.map(function (tier) {
    start(army, tier);
  });

  remove(activePlots);

  advance(activePlots);
};

exports.update = function (army) {
  update(army);
};
