var manager = require('../staff/manager');
var engine = require('../engine');

exports.inspectToggle = function (army, officer) {
  manager.inspectToggle(army, officer);
};
exports.inspectReset = function (army) {
  manager.inspectReset(army);
};
exports.turnsToggle = function () {
  engine.army().turns = !engine.army().turns;
};
