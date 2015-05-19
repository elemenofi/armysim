var staffManager = require('../staff/staffManager');
var armyEngine = require('../armyEngine');

exports.inspectToggle = function (army, officer) {
  staffManager.inspectToggle(army, officer);
};

exports.turnsToggle = function () {
  armyEngine.army().turns = !armyEngine.army().turns;
};