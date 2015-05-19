var helpers = require('../utils/helpers');
var _ = require('underscore');
var staffManager = require('../staff/staffManager');

function updatePlots(army) {

  function forceRetire (target, army, message, plotters) {
    
    var plottersNames = '';

    _.each(plotters, function (plotter) {

      plotter.plotting = false;

      plottersNames += ' ' + plotter.rank + ' ' + plotter.lastName;

    });

    staffManager.retireSpecificOfficer(target, army, message + " by " + plottersNames);

  };

  function applyPlot (plotters, plotLeader, target, message) {
    
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

        forceRetire(target, army, message, plotters);

      };

    } else {

      _.each(plotters, function(plotter) {
      
        plotter.plotting = false;
      
      });

    };
  };

  function planDivisionPlots () {

    var target = army.commander;
    var plotters = [];

    _.each(army.divisions, function (division) {
    
      if ((division.commander.drift > 500 && target.drift < 500) || (division.commander.drift < 500 && target.drift > 500)) {
    
        plotters.push(division.commander);
        applyPlot(plotters, division.commander, target, "forced to retire");
    
      } else {
    
        division.commander.plotting = false;
    
      };
    
    });
  
  };

  function planBrigadePlots () {

    _.each(army.divisions, function (division) {

      var plotters = [];

      _.each(division.brigades, function(brigade) {
  
        if ((brigade.commander.drift > 500 && division.commander.drift < 500) || (brigade.commander.drift < 500 && division.commander.drift > 500)) {

          plotters.push(brigade.commander);
          applyPlot(plotters, brigade.commander, division.commander, "forced to retire");

  
        } else {
          brigade.commander.plotting = false;
  
        };
  
      });

    });
    
  };

  function planRegimentPlots () {

    _.each(army.brigades, function (brigade) {

      var plotters = [];

      _.each(brigade.regiments, function(regiment) {
        if ((regiment.commander.drift > 500 && brigade.commander.drift < 500) || (regiment.commander.drift < 500 && brigade.commander.drift > 500)) {

          plotters.push(regiment.commander);
          applyPlot(plotters, regiment.commander, brigade.commander, "forced to retire");

        } else {
          regiment.commander.plotting = false;
        };
      });

    });

  };

  function planCompanyPlots () {
  
    _.each(army.regiments, function (regiment) {
  
      var plotters = [];
  
      _.each(regiment.companies, function(company) {
  
        if ((company.commander.drift > 500 && regiment.commander.drift < 500) || (company.commander.drift < 500 && regiment.commander.drift > 500)) {
          plotters.push(company.commander);
          applyPlot(plotters, company.commander, regiment.commander, "forced to retire");
  
        } else {
  
          company.commander.plotting = false;
  
        };
  
      });
  
    });
  
  };

  function planBattalionPlots () {
    
    _.each(army.companies, function (company) {
    
      var plotters = [];
      
      _.each(company.battalions, function(battalion) {
      
        if ((battalion.commander.drift > 500 && company.commander.drift < 500) || (battalion.commander.drift < 500 && company.commander.drift > 500)) {
      
          plotters.push(battalion.commander);
          applyPlot(plotters, battalion.commander, company.commander, "forced to retire");
      
        } else {
      
          battalion.commander.plotting = false;
      
        };
      
      });
    
    });
  
  };

  planDivisionPlots();
  planBrigadePlots();
  planRegimentPlots();
  planCompanyPlots();
  planBattalionPlots();
};

exports.update = function (army) {
  updatePlots(army);
};
