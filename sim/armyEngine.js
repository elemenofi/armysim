var army = {
  id: 1,
  type: "army",
  commander: {},
  staff: [],
  divisions: [],
  brigades: [],
  regiments: [],
  companies: [],
  battalions: [],
  ltGenerals: [],
  dvGenerals: [],
  bgGenerals: [],
  coronels: [],
  majors: [],
  captains: [],
  retired: {
    ltGenerals: [],
    dvGenerals: [],
    bgGenerals: [],
    coronels: [],
    majors: [],
    captains: []
  }
};

exports.army = function () {
  return army;
};

var unitManager = require('./unitManager.js');
var staffManager = require('./staffManager.js');
var rewardManager = require('./rewardManager.js');
var driftDynamics = require('./driftDynamics.js');
var bondDynamics = require('./bondDynamics.js');
var plotDynamics = require('./plotDynamics.js');

var day = 0;
var globalLog = '';

function randomNumber (range) {
    return Math.floor(Math.random() * range);
};

function passTurn () {
  if ( day === 0 ) {
    unitManager.initArmy(army);
    staffManager.initStaff(army);
    day++;
  } else {
    rewardManager.rewardStaff(army);
    staffManager.retireStaff(army);
    driftDynamics.update(army);
    bondDynamics.update(army);
    plotDynamics.update(army);
    day++;
  };
};

setInterval(function () {
    passTurn();
}, 500);

exports.inspectToggle = function (officer) {
  staffManager.inspectToggle(army, officer);
};
