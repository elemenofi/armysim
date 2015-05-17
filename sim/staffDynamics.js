var staffManager = require('./staffManager.js');
var _ = require('underscore');

function updateDrifts (army) {

  function updateMajors () {

    _.each(army.companies, function (company) {

      company.drift = 0;

      _.each(company.battalions, function (battalion){

        if (battalion.commander.drift > 500) {
          company.drift++;
        } else {
          company.drift--;
        };

      });

      if (company.drift >= 2) {
        company.commander.drifting = "right";
      } else if (company.drift <= -2) {
        company.commander.drifting = "left";
      } else {
        company.commander.drifting = "center";
      };

    });

    _.each(army.majors, function(major) {
      if (major.drifting === "right") {
        major.drift++;
      } else if (major.drifting === "left") {
        major.drift--;
      }
    });

  };

  updateMajors();
};

exports.update = function (army) {
  updateDrifts(army);
};
