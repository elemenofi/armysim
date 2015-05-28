var staffManager = require('../staff/manager');
var armyEngine = require('../armyEngine');

exports.inspectToggle = function (army, officer) {
  staffManager.inspectToggle(army, officer);
};

exports.inspectReset = function (army) {
  staffManager.inspectReset(army);
};

exports.turnsToggle = function () {
  armyEngine.army().turns = !armyEngine.army().turns;
};
