var _ = require('underscore');

function updateBonds (army) {

  function checkIfBondExisted (commander, otherCommander) {

    _.each(commander.bonds, function(bond) {

      if (bond.id === otherCommander.id) {

        hadBond = true;
        bond.strength++;

      };

    });

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

    if (commander.drift > 500 && otherCommander.drift > 500 || commander.drift < 500 && otherCommander.drift < 500) {

      var hadBond = false;

      checkIfBondExisted(commander, otherCommander);

      if (!hadBond) {

        addNewBond(commander, otherCommander);

      };

    };

  };

  function createBondsByUnits (units) {

    _.each(army[units], function(unit) {

      _.each(army[units], function(otherUnit) {

        if (unit.parentId === otherUnit.parentId && unit.id != otherUnit.id) {

          tryToBond(unit.commander, otherUnit.commander);

        };

      });

    });

  };

  createBondsByUnits("battalions");
  createBondsByUnits("companies");
  createBondsByUnits("regiments");
  createBondsByUnits("brigades");
  createBondsByUnits("divisions");

};

exports.update = function (army) {
  updateBonds(army);
};
