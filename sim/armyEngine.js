var templates = require('./data/templates');
var interface = require('./interface/interface');
var units = require('./units/manager');
var staff = require('./staff/manager');
var rewards = require('./staff/rewards');
var retirements = require('./staff/retire');
var helpers = require('./utils/helpers');
require('date-utils');
var plots = require('./events/plots');

var army = templates.army;
var day = 0;
army.date = new Date();

function passTurn () {
  if (army.turns) {
    if ( day === 0 ) {
      units.init(army);
      staff.init(army);
    } else {
      helpers.formatDate(army.date);
      rewards.update(army);
      retirements.update(army);
      plots.update(army);
    };

    helpers.formatDate(army.date);
    day++;
  };
};

exports.army = function () {
  return army;
};
exports.actions = function () {
  return interface;
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
