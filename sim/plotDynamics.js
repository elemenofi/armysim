var _ = require('underscore');
var staffManager = require('./staffManager.js');

function updatePlots(army) {

  function applyPlot (plotters, plotLeader, target, message) {
    if (plotters.length >= 2) {
      target.prestige = target.prestige - Math.round(plotLeader.prestige / 5);
      _.each(plotters, function(plotter) {
        plotter.plotting = true;
      });
      if (target.prestige <= plotLeader.prestige) {
        staffManager.retireSpecificOfficer(target, army, message);
        _.each(plotters, function(plotter) {
          plotter.plotting = false;
        });
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
        applyPlot(plotters, division.commander, target, "Division Generals pressure");
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
          applyPlot(plotters, brigade.commander, division.commander, "Brigadier Generals pressure");
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
          applyPlot(plotters, regiment.commander, brigade.commander, "Coronels pressure");
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
          applyPlot(plotters, company.commander, regiment.commander, "Majors pressure");
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
          applyPlot(plotters, battalion.commander, company.commander, "Captains pressure");
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
