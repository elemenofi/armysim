var armyEngine = require('../armyEngine');
var _ = require('underscore');

var checkLastNamesRepeat = function (officer, lastNames) {
  
  var repeats = 0;

  _.each(lastNames, function(lastName) {
  
    if (lastName.lastName === officer.lastName && lastName.id != officer.id) {
      repeats++;
    };
  
  });

  return repeats;

};

exports.checkLastNamesRepeat = checkLastNamesRepeat;