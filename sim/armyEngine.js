var unitManager = require('./unitManager.js');
var staffManager = require('./staffManager.js');

var day = 0;
var globalOfficerId = 1;
var globalLogId = 1;

var army = {
  id: 1,
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
    day++;
  }
}

setInterval(function () {
    passTurn();
}, 2000);

exports.army = function () {
  return army;
};
