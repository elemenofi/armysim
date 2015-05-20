var templates = require('./data/templates');
var armyInterface = require('./interface/interface');
var unitManager = require('./units/unitManager');
var staffManager = require('./staff/staffManager');
var staffRewards = require('./staff/staffRewards');
var staffRetire = require('./staff/staffRetire');
var driftDynamics = require('./events/driftDynamics');
var bondDynamics = require('./events/bondDynamics');
var plotDynamics = require('./events/plotDynamics');

var army = templates.army;
var day = 0;

function passTurn () {

  if (army.turns) {

    if ( day === 0 ) {

      unitManager.initUnits(army);
      staffManager.initStaff(army);

    } else {

      staffRewards.rewardStaff(army);
      staffRetire.retireStaff(army);
      driftDynamics.update(army);
      bondDynamics.update(army);
      plotDynamics.update(army);

    };

    day++;

  };

};

setInterval(function () {
    passTurn();
}, 2000);

exports.army = function () {
  return army;
};

exports.actions = function () {
  return armyInterface;
};



