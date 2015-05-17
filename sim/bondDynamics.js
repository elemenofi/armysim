var _ = require('underscore');

function updateBonds(army) {

  function tryBond(commander, otherCommander) {

    if (commander.drift > 500 && otherCommander.drift > 500 || commander.drift < 500 && otherCommander.drift < 500 ) {

      if (commander.id !== otherCommander.id) {

        var hadBond = false;

        _.each(commander.bonds, function(bond) {
          if (bond.friendId === otherCommander.id) {
            hadBond = true;
          };
        });

        if (!hadBond) {
          commander.bonds.push({friendId: otherCommander.id, strength: 0});
        };

      };

    };

  };

  function createBondsByUnits (units) {

    _.each(army[units], function(unit) {
      _.each(army[units], function(otherUnit) {
        if (unit.parentId === otherUnit.parentId) {
          tryBond(unit.commander, otherUnit.commander);
        }
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
