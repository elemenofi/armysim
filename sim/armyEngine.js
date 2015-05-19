var templates = require('./data/templates');
var staffInterface = require('./interface/staff');

var army = templates.army;

exports.army = function () {
  return army;
};

exports.actions = function () {
  return staffInterface;
};

var unitManager = require('./units/unitManager');
var staffManager = require('./staff/staffManager');
var staffRewards = require('./staff/staffRewards');
var driftDynamics = require('./events/driftDynamics');
var bondDynamics = require('./events/bondDynamics');
var plotDynamics = require('./events/plotDynamics');

var day = 0;

function passTurn () {
  if ( day === 0 ) {
    unitManager.initUnits(army);
    staffManager.initStaff(army);
  } else {
    staffRewards.rewardStaff(army);
    staffManager.retireStaff(army);
    driftDynamics.update(army);
    bondDynamics.update(army);
    plotDynamics.update(army);
  };
  day++;
};

setInterval(function () {
    passTurn();
}, 2000);


