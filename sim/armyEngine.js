var templates = require('./data/templates');
var armyInterface = require('./interface/interface');
var unitManager = require('./units/unitManager');
var staffManager = require('./staff/staffManager');
var staffRewards = require('./staff/staffRewards');
var staffRetire = require('./staff/staffRetire');
var driftDynamics = require('./events/driftDynamics');
var bondDynamics = require('./events/bondDynamics');
var plotDynamics = require('./events/plotDynamics');
require('date-utils');

var army = templates.army;
var day = 0;
var lastNames = [];

army.date = new Date();

function formatDate (date) {
  army.formatedDate = army.date.toFormat("DDDD the D of MMMM, YYYY");
  army.formatedDate = army.formatedDate;
  army.formatedDate = army.formatedDate.split(" ");
  army.formatedDate[2] = army.date.toFormat("D") + ordinal_suffix_of(army.date.toFormat("D"));
  army.formatedDate = army.formatedDate.join(" ");
};

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}


setInterval(function(){
  army.date = army.date.addDays(1);
}, 10)

function passTurn () {

  if (army.turns) {

    if ( day === 0 ) {

      unitManager.initUnits(army);
      staffManager.initStaff(army);

    } else {

      formatDate(army.date);
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
}, 500);

exports.army = function () {
  return army;
};

exports.actions = function () {
  return armyInterface;
};

exports.lastNames = function () {
  return lastNames;
}


