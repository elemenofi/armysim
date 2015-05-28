var templates = require('./data/templates');
var armyInterface = require('./interface/interface');
var unitManager = require('./units/manager');
var staffManager = require('./staff/manager');
var staffRewards = require('./staff/rewards');
var staffRetire = require('./staff/retire');
var helpers = require('./utils/helpers');
require('date-utils');
var plots = require('./events/plots');
var army = templates.army;
var day = 0;
var lastNames = [];

army.date = new Date();

function passTurn () {

  if (army.turns) {

    if ( day === 0 ) {

      helpers.formatDate(army.date);
      unitManager.initUnits(army);
      staffManager.initStaff(army);

    } else {

      helpers.formatDate(army.date);
      staffRewards.rewardStaff(army);
      staffRetire.retireStaff(army);
      plots.update(army);
      // driftDynamics.update(army);
      // bondDynamics.update(army);
      // plotDynamics.update(army);
      // terrorDynamics.update(army);
      // suicideDynamics.update(army);

    };

    day++;
    console.log("Passing turn #" + day);

  };

};

exports.army = function () {
  return army;
};

exports.actions = function () {
  return armyInterface;
};

exports.lastNames = function () {
  return lastNames;
};

for (var i = 0; i < 500; i++) {
    passTurn();
};


setInterval(function(){
  if (army.turns) {
    army.date = army.date.addDays(1);
  };
}, 10);

setInterval(function () {
    passTurn();
}, 500);
