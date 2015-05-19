var _ = require('underscore');

function updateDrifts (army) {

  function updateCommanderDriftStatus (unit, subUnit) {

    if (unit.drift === 1) {

      subUnit.commander.drifting = "right";

    } else if (unit.drift === -1) {

      subUnit.commander.drifting = "left";

    } else {

      subUnit.commander.drifting = "center";

    };

  };

  function driftCommander (rank) {

    _.each(army[rank], function(commander) {

      if (commander.retired === false && commander.drifting === "right") {
        
        commander.drift++;
        
      } else if (commander.retired === false && commander.drifting === "left") {
        
        commander.drift--;
        
      };

    });

  };

  function updateDriftsByRank (rank, units, subUnits) {
    _.each(army[units], function (unit) {

      unit.drift = 0;

      if (unit.commander.drift > 500) {
        unit.drift = 1;
      } else {
        unit.drift = -1;
      };

      _.each(unit[subUnits], function (subUnit) {

        updateCommanderDriftStatus(unit, subUnit);

      });

    });

    driftCommander(rank);

  };

  function updateDvGenerals () {

    army.drift = 0;

    if (army.commander.drift > 500) {
      army.drift = 1;
    } else {
      army.drift = -1;
    };

    _.each(army.divisions, function (division) {

      updateCommanderDriftStatus(army, division);

    });

    driftCommander("dvGenerals");

  };

  updateDriftsByRank("captains", "companies", "battalions");
  updateDriftsByRank("majors", "regiments", "companies");
  updateDriftsByRank("coronels", "brigades", "regiments");
  updateDriftsByRank("bgGenerals", "brigades", "divisions");
  updateDvGenerals();

};

exports.update = function (army) {
  updateDrifts(army);
};
