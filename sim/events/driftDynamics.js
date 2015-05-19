var _ = require('underscore');

function updateDrifts (army) {

  function driftCommander (rank) {

    _.each(army[rank], function(commander) {

      if (commander.retired === false && commander.drifting === "right") {
        
        commander.drift++;
        
      } else if (commander.retired === false && commander.drifting === "left") {
        
        commander.drift--;
        
      };

    });

  };

  function updateCommanderDriftStatus (unit, subUnit) {

    if (unit.drift === 1) {

      subUnit.commander.drifting = "right";

    } else if (unit.drift === -1) {

      subUnit.commander.drifting = "left";

    } else {

      subUnit.commander.drifting = "center";

    };

  };

  function updateUnitsDriftStatus (unit, subUnits) {

    unit.drift = 0;
  
    if (unit.commander.drift > 500) {
      
      unit.drift = 1;

    } else {

      unit.drift = -1;

    };

    _.each(unit[subUnits], function (subUnit) {

      updateCommanderDriftStatus(unit, subUnit);

    });
  
  };

  function updateDriftsByRank (rank, units, subUnits) {

    if (units === army) {

      updateUnitsDriftStatus(army, subUnits);

    };
    
    _.each(army[units], function (unit) {

      updateUnitsDriftStatus(unit, subUnits);

    });

    driftCommander(rank);

  };

  updateDriftsByRank("captains", "companies", "battalions");
  updateDriftsByRank("majors", "regiments", "companies");
  updateDriftsByRank("coronels", "brigades", "regiments");
  updateDriftsByRank("bgGenerals", "divisions", "brigades");
  updateDriftsByRank("dvGenerals", army, "divisions");

};

exports.update = function (army) {
  updateDrifts(army);
};
