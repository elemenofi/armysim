var helpers = require('./utils/helpers');
var templates = require('./utils/templates');
var interface = require('./interface/interface');
var units = require('./units/manager');
var staff = require('./staff/manager');
var rewards = require('./staff/reward');
var retirements = require('./staff/retire');
var plots = require('./events/plots');
require('date-utils');


var army = templates.army;
var day = 0;
army.rawDate = new Date();

function passTurn () {
  if (army.turns) {
    if ( day === 0 ) {
      units.init(army);
      staff.init(army);
    } else {
      helpers.formatDate(army.rawDate);
      rewards.update(army);
      retirements.update(army);
      plots.update(army);
    };

    helpers.formatDate(army.rawDate);
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
    army.rawDate = army.rawDate.addDays(1);
  };
}, 10);

setInterval(function () {
    passTurn();
}, 500);
