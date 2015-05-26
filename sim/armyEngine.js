var templates = require('./data/templates');
var armyInterface = require('./interface/interface');
var unitManager = require('./units/unitManager');
var staffManager = require('./staff/staffManager');
var staffRewards = require('./staff/staffRewards');
var staffRetire = require('./staff/staffRetire');
var driftDynamics = require('./events/driftDynamics');
var bondDynamics = require('./events/bondDynamics');
var plotDynamics = require('./events/plotDynamics');
var terrorDynamics = require('./events/terrorDynamics');
var helpers = require('./utils/helpers');
require('date-utils');

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
      driftDynamics.update(army);
      bondDynamics.update(army);
      plotDynamics.update(army);
      terrorDynamics.update(army);

    };

    day++;

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

setInterval(function(){
  if (army.turns) {
    army.date = army.date.addDays(1);
  };
}, 10);

setInterval(function () {
    passTurn();
}, 500);

