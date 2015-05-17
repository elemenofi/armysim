var _ = require('underscore');
var staffManager = require('./staffManager.js');

function updatePlots(army) {

  function applyPlot (plotters, plotLeader, target, message, targetBonds) {
    if (plotters.length >= 2) {

      var targetImmune = false;
      var prestigeHit = 0;
      var plotIntelligence = 0;
      var plotPrestige = 0;

      // check for immunities
      _.each(targetBonds, function (bond) {

        if (bond[0] === undefined) {
          bond[0] = {};
        };

        if (army.commander.id === bond[0].id) {

          _.each(plotters, function (plotter) {

            var message = "dishonorably discharged"
            staffManager.retireSpecificOfficer(plotter, army, message);

          });

        };

      });

      if (!targetImmune) {
          // plot strength computation
        _.each(plotters, function(plotter) {

          plotter.plotting = true;
          plotIntelligence += Math.round(plotter.intelligence / 2);
          plotPrestige += Math.round(plotter.prestige / 2);
          prestigeHit += Math.round(plotter.prestige / 10);

        });

        // actual application of the plot damage to the targets prestige
        target.prestige -= prestigeHit;

        // retirement of plotTarget
        if ((target.prestige + target.intelligence / 2) <= plotPrestige) {

          staffManager.retireSpecificOfficer(target, army, message);

          _.each(plotters, function(plotter) {
            plotter.plotting = false;
          });

        };
      };

    } else {

      //reset plotters
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
    var dvGeneralBonds = [];

    _.each(army.divisions, function (division) {

      var plotters = [];
      dvGeneralBonds.push(division.commander.bonds);

      _.each(division.brigades, function(brigade) {
        if ((brigade.commander.drift > 500 && division.commander.drift < 500) || (brigade.commander.drift < 500 && division.commander.drift > 500)) {

          plotters.push(brigade.commander);
          applyPlot(plotters, brigade.commander, division.commander, "forced to retire", dvGeneralBonds);

        } else {
          brigade.commander.plotting = false;

        };
      });

    });
  };

  function planRegimentPlots () {
    var bgGeneralBonds = [];
    _.each(army.brigades, function (brigade) {

      var plotters = [];
      bgGeneralBonds.push(brigade.commander.bonds);

      _.each(brigade.regiments, function(regiment) {
        if ((regiment.commander.drift > 500 && brigade.commander.drift < 500) || (regiment.commander.drift < 500 && brigade.commander.drift > 500)) {

          plotters.push(regiment.commander);
          applyPlot(plotters, regiment.commander, brigade.commander, "forced to retire", bgGeneralBonds);

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
