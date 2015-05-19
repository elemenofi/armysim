var helpers = require('../utils/helpers');
var _ = require('underscore');
var staffManager = require('../staff/staffManager');

function updatePlots(army) {

  function forceRetire (target, message, plotters) {
    
    var plottersNames = '';

    _.each(plotters, function (plotter) {

      plotter.plotting = false;

      plottersNames += ' ' + plotter.rank + ' ' + plotter.lastName;

    });

    staffManager.retireSpecificOfficer(target, army, message + " by " + plottersNames);

  };

  function applyPlot (plotters, target, message) {
    
    if (plotters.length >= 2) {

      var prestigeHit = 0;
      var plotPrestige = 0;

      _.each(plotters, function(plotter) {

        plotter.plotting = true;
        plotPrestige += Math.round(plotter.prestige / 2);
        prestigeHit += Math.round(plotter.prestige / 10);

      });

      target.prestige -= prestigeHit;

      if (target.prestige <= plotPrestige) {

        forceRetire(target, message, plotters);

      };

    } else {

      _.each(plotters, function(plotter) {
      
        plotter.plotting = false;
      
      });

    };
    
  };

  function checkPlottingSubUnits (unit, subUnits, plotters) {

    _.each(unit[subUnits], function (subUnit) {
  
      if ((subUnit.commander.drift > 500 && unit.commander.drift < 500) || (subUnit.commander.drift < 500 && unit.commander.drift > 500)) {
  
        plotters.push(subUnit.commander);
        applyPlot(plotters, unit.commander, "forced to retire");
      
      } else {
  
        subUnit.commander.plotting = false;
      
      };
  
    });

  };

  function planPlots (units, subUnits) {

    if (units === "army") {

      var plotters = [];

      checkPlottingSubUnits(units, subUnits, plotters);

    } else {

      _.each(army[units], function (unit) {
      
        var plotters = [];

        checkPlottingSubUnits(unit, subUnits, plotters);

      });

    };
    
  };

  planPlots("army", "divisions");
  planPlots("divisions", "brigades");
  planPlots("brigades", "regiments");
  planPlots("regiments", "companies");
  planPlots("companies", "battalions");

};

exports.update = function (army) {
  updatePlots(army);
};
