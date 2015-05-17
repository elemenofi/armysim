var _ = require('underscore');

function updateDrifts (army) {

  function updateCommanderDriftStatus (parentUnit, unit) {

    if (parentUnit.drift === 1) {
      unit.commander.drifting = "right";
    } else if (parentUnit.drift === -1) {
      unit.commander.drifting = "left";
    } else {
      unit.commander.drifting = "center";
    };

  };

  function driftCommander (rank) {

    _.each(army[rank], function(commander) {

      if (commander.retired === false) {
        if (commander.drifting === "right") {
          commander.drift = commander.drift + 1;
        } else if (commander.drifting === "left") {
          commander.drift = commander.drift - 1;
        };
      }

    });

  };

  function updateCaptains () {

    _.each(army.companies, function (company) {

      company.drift = 0;

      if (company.commander.drift > 500) {
        company.drift = 1;
      } else {
        company.drift = -1;
      };

      _.each(company.battalions, function (battalion) {

        updateCommanderDriftStatus(company, battalion);

      });

    });

    driftCommander("captains");

  };

  function updateMajors () {

    _.each(army.regiments, function (regiment) {

      regiment.drift = 0;

      if (regiment.commander.drift > 500) {
        regiment.drift = 1;
      } else {
        regiment.drift = -1;
      };

      _.each(regiment.companies, function (company) {

        updateCommanderDriftStatus(regiment, company);

      });

    });

    driftCommander("majors");

  };

  function updateCoronels () {

    _.each(army.brigades, function (brigade) {

      brigade.drift = 0;

      if (brigade.commander.drift > 500) {
        brigade.drift = 1;
      } else {
        brigade.drift = -1;
      };

      _.each(brigade.regiments, function (regiment) {

        updateCommanderDriftStatus(brigade, regiment);

      });

    });

    driftCommander("coronels");

  };

  function updateBgGenerals () {

    _.each(army.divisions, function (division) {

      division.drift = 0;

      if (division.commander.drift > 500) {
        division.drift = 1;
      } else {
        division.drift = -1;
      };

      _.each(division.brigades, function (brigade) {

        updateCommanderDriftStatus(division, brigade);

      });

    });

    driftCommander("bgGenerals");

  };

  function updateDvGenerals () {

    army.drift = 0;

    if (army.commander.drift > 500) {
      army.drift = 1;
    } else {
      army.drift = -1;
    };

    _.each(army.divisions, function (division) {

      updateCommanderDriftStatus(army, division);

    });

    driftCommander("dvGenerals");

  };

  updateCaptains();
  updateMajors();
  updateCoronels();
  updateBgGenerals();
  updateDvGenerals();

};

exports.update = function (army) {
  updateDrifts(army);
};
