var _ = require('underscore');
var staffManager = require('./staffManager.js');

function updatePlots(army) {

  var ltGeneralDrift = army.commander.drift;
  var plotters = 0;

  _.each(army.divisions, function (division) {
    if ((division.commander.drift > 500 && ltGeneralDrift < 500) || (division.commander.drift < 500 && ltGeneralDrift > 500)) {
      plotters++;
    };
  });

  if (plotters >= 2) {
    staffManager.retireSpecificOfficer(army.commander, army, "Division Generals Coup");
  };

};

exports.update = function (army) {
  updatePlots(army);
};
