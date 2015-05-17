var _ = require('underscore');
var staffManager = require('./staffManager.js');

function updatePlots(army) {

  function applyPlot (plotters, plotLeader, target, message) {
    if (plotters >= 2) {
      target.prestige = target.prestige - Math.round(plotLeader.prestige / 5);
      if (target.prestige <= plotLeader.prestige) {
        staffManager.retireSpecificOfficer(target, army, message);
      };
    };
  };

  function planDivisionPlots () {
    var target = army.commander;
    var plotters = 0;

    _.each(army.divisions, function (division) {
      if ((division.commander.drift > 500 && target.drift < 500) || (division.commander.drift < 500 && target.drift > 500)) {
        plotters++;
        applyPlot(plotters, division.commander, target, "Division Generals pressure");
      };
    });
  };

  function planBrigadePlots () {
    _.each(army.divisions, function (division) {
      var plotters = 0;
      _.each(division.brigades, function(brigade) {
        if ((brigade.commander.drift > 500 && division.commander.drift < 500) || (brigade.commander.drift < 500 && division.commander.drift > 500)) {
          plotters++;
          applyPlot(plotters, brigade.commander, division.commander, "Brigadier Generals pressure");
        };
      });
    });
  };

  function planRegimentPlots () {
    _.each(army.brigades, function (brigade) {
      var plotters = 0;
      _.each(brigade.regiments, function(regiment) {
        if ((regiment.commander.drift > 500 && brigade.commander.drift < 500) || (regiment.commander.drift < 500 && brigade.commander.drift > 500)) {
          plotters++;
          applyPlot(plotters, regiment.commander, brigade.commander, "Coronels pressure");
        };
      });
    });

  };

  function planCompanyPlots () {
    _.each(army.regiments, function (regiment) {
      var plotters = 0;
      _.each(regiment.companies, function(company) {
        if ((company.commander.drift > 500 && regiment.commander.drift < 500) || (company.commander.drift < 500 && regiment.commander.drift > 500)) {
          plotters++;
          applyPlot(plotters, company.commander, regiment.commander, "Majors pressure");
        };
      });
    });
  };

  function planBattalionPlots () {
    _.each(army.companies, function (company) {
      var plotters = 0;
      _.each(company.battalions, function(battalion) {
        if ((battalion.commander.drift > 500 && company.commander.drift < 500) || (battalion.commander.drift < 500 && company.commander.drift > 500)) {
          plotters++;
          applyPlot(plotters, battalion.commander, company.commander, "Captains pressure");
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
