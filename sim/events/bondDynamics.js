var _ = require('underscore');
var values = require('../data/values');

function updateBonds (army) {

  function checkHadBond (commander, otherCommander) {

    _.each(commander.bonds, function(bond) {

      if (bond.id === otherCommander.id) {

        bond.strength++;
        return true;

      };

    });

    return false;

  };

  function addNewBond (commander, otherCommander) {

    var newBond = otherCommander;

    commander.bonds.push({
  
      id: newBond.id, 
      name: newBond.lastName, 
      strength: 0
  
    });

  };

  function tryToBond (commander, otherCommander) {
    var bothRightDrift = commander.drift > values.centerDrift && 
                        otherCommander.drift > values.centerDrift;
    var bothLeftDrift = commander.drift < values.centerDrift && 
                        otherCommander.drift < values.centerDrift;
    if ( bothRightDrift || bothLeftDrift ) {
      var hadBond = checkHadBond(commander, otherCommander);
      if (!hadBond) {
        addNewBond(commander, otherCommander);
      };
    };
  };

  function createBondsByUnits (units) {
    army[units].map(function(unit) {
      army[units].map(function(otherUnit) {
        if (unit.parentId === otherUnit.parentId && unit.id != otherUnit.id) {
          tryToBond(unit.commander, otherUnit.commander);
        };
      }); 
    });
  };

  createBondsByUnits("platoons");
  createBondsByUnits("battalions");
  createBondsByUnits("companies");
  createBondsByUnits("regiments");
  createBondsByUnits("brigades");
  createBondsByUnits("divisions");
  createBondsByUnits("corps");
};

exports.update = function (army) {
  updateBonds(army);
};
