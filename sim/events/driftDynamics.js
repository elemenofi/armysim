var _ = require('underscore');
var terrorDynamics = require('./terrorDynamics');
var values = require('../data/values');

function updateDrifts (army) {

  function checkExtremes (commander) {

    if (!commander.retired) {
    
      if (commander.drift < values.radicalThreshold) {
  
        terrorDynamics.radicals.push(commander);
  
      } else if (commander.drift > values.conservativeThreshold) {
  
        terrorDynamics.conservatives.push(commander);
      
      };
    
    };
  
  };

  function setAlign (commander) {
    
    if (commander.drift > values.centerDrift) {
      
      commander.align = "conservative";

    } else {

      commander.align = "radical";

    };
  
  };

  function driftCommander (rank) {

    _.each(army[rank], function(commander) {

      if (commander.retired === false && commander.drifting === "right" && commander.drift < values.baseDrift) {
        
        commander.drift++;
        
      } else if (commander.retired === false && commander.drifting === "left" && commander.drift > 0) {
        
        commander.drift--;
        
      };

      setAlign(commander);
      checkExtremes(commander);

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
  
    if (unit.commander.drift > values.centerDrift) {
      
      unit.drift = 1;

    } else {

      unit.drift = -1;

    };

    _.each(unit[subUnits], function (subUnit) {

      updateCommanderDriftStatus(unit, subUnit);

    });
  
  };

  function updateDriftsByRank (rank, units, subUnits) {1

    if (units === army) {

      updateUnitsDriftStatus(army, subUnits);

    };
    
    _.each(army[units], function (unit) {

      updateUnitsDriftStatus(unit, subUnits);

    });

    driftCommander(rank);

  };

  updateDriftsByRank("captains", "battalions", "platoons");
  updateDriftsByRank("majors", "companies", "battalions");
  updateDriftsByRank("ltCoronels", "regiments", "companies");
  updateDriftsByRank("coronels", "brigades", "regiments");
  updateDriftsByRank("bgGenerals", "divisions", "brigades");
  updateDriftsByRank("dvGenerals", "corps", "divisions");
  updateDriftsByRank("ltGenerals", army, "corps");

};

exports.update = function (army) {
  updateDrifts(army);
};
