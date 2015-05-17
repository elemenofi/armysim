var unitManager = require('./unitManager.js');
var staffManager = require('./staffManager.js');
var driftDynamics = require('./driftDynamics.js');
var bondDynamics = require('./bondDynamics.js');
var plotDynamics = require('./plotDynamics.js');

var day = 0;
var globalOfficerId = 1;
var globalLogId = 1;

var army = {
  id: 1,
  type: "army",
  commander: {},
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
  captains: []
};

function randomNumber (range) {
    return Math.floor(Math.random() * range);
};

function passTurn () {
  if ( day === 0 ) {
    unitManager.initArmy(army);
    staffManager.initStaff(army);
    day++;
  } else {
    staffManager.rewardStaff();
    staffManager.retireStaff(army);
    driftDynamics.update(army);
    bondDynamics.update(army);
    plotDynamics.update(army);
    day++;
  };
};

setInterval(function () {
    passTurn();
}, 2000);

exports.inspectToggle = function (officer) {
  staffManager.inspectToggle(officer);
};

exports.army = function () {
  return army;
};