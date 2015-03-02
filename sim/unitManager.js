var _ = require('underscore');

var globalUnitId = 2;
var globalUnitDepth = 2;

var names = require('./names.js');

exports.initArmy = function (army) {

  function generateUnit (type, quantity, parent) {
      if (quantity === 0) {
        return;
      } else {

        var unit = {};
        unit.id = globalUnitId;
        unit.type = type;
        if (parent) {
          unit.parentId = parent.id;
        }
        globalUnitId++;

        switch (type) {
          case "division":
            unit.brigades = [];
            unit.name = names.divisions[0];

            names.divisions.shift();
            army.divisions.push(unit);
            generateUnit("brigade", globalUnitDepth, unit);
            generateUnit("division", quantity - 1, parent);
          break;

          case "brigade":
            unit.regiments = [];
            unit.name = names.brigades[0];

            names.brigades.shift();
            parent.brigades.push(unit);
            army.brigades.push(unit);

            generateUnit("regiment", globalUnitDepth, unit);
            generateUnit("brigade", quantity - 1, parent);
          break;

          case "regiment":
            unit.companies = [];
            unit.name = names.regiments[0];

            names.regiments.shift();
            parent.regiments.push(unit);
            army.regiments.push(unit);

            generateUnit("company", globalUnitDepth, unit);
            generateUnit("regiment", quantity - 1, parent);
          break;

          case "company":
            unit.battalions = [];
            unit.name = names.companies[0];

            names.companies.shift();
            parent.companies.push(unit);
            army.companies.push(unit);

            generateUnit("battalion", globalUnitDepth, unit);
            generateUnit("company", quantity - 1, parent);
          break;

          case "battalion":
            unit.name = names.battalions[0];

            names.battalions.shift();
            parent.battalions.push(unit);
            army.battalions.push(unit);

            generateUnit("battalion", quantity - 1, parent);
          break;
        }
      }
    };

    generateUnit("division", globalUnitDepth);

  return army;
};