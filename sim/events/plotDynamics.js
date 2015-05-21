var helpers = require('../utils/helpers');
var _ = require('underscore');
var values = require('../data/values');
var staffRetire = require('../staff/staffRetire');

function updatePlots(army) {

  function plottersNames (plotters) {

    var plottersNames = [];

    _.each(plotters, function (plotter) {

      plotter.plotting = false;

      plottersNames.push(plotter.rank + ' ' + plotter.lastName);

    });

    return plottersNames;
  
  };

  function forceRetire (target, plotters) {

    var message = values.statusMessages.forcedRetire(plottersNames(plotters))
    
    staffRetire.retireSpecificOfficer(target, army, message);

  };

  function applyPlot (plotters, target) {
    
    if (plotters.length >= 2) {

      var prestigeHit = 0;
      var plotPrestige = 0;

      _.each(plotters, function(plotter) {

        plotter.plotting = true;
        plotPrestige += values.plotPrestige(plotter);
        prestigeHit += values.prestigeHit(plotter);

      });

      target.prestige -= prestigeHit;

      if (target.prestige <= plotPrestige) {

        forceRetire(target, plotters);

      };

    } else {

      _.each(plotters, function(plotter) {
      
        plotter.plotting = false;
      
      });

    };
    
  };

  function checkPlottingSubUnits (unit, subUnits, plotters) {

    _.each(unit[subUnits], function (subUnit) {

      var differentDriftsA = (subUnit.commander.drift > values.centerDrift 
                              && unit.commander.drift < values.centerDrift);
      var differentDriftsB = (subUnit.commander.drift < values.centerDrift 
                              && unit.commander.drift > values.centerDrift);
      
      if ( differentDriftsA || differentDriftsB ) {
  
        plotters.push(subUnit.commander);
        applyPlot(plotters, unit.commander);
      
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

  planPlots("army", "corps");
  planPlots("corps", "divisions");
  planPlots("divisions", "brigades");
  planPlots("brigades", "regiments");
  planPlots("regiments", "companies");
  planPlots("companies", "battalions");
  planPlots("battalions", "platoons");

};

exports.update = function (army) {
  updatePlots(army);
};
