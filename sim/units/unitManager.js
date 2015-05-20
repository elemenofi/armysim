var _ = require('underscore');
var names = require('../data/names');
var values = require('../data/values');

exports.initUnits = function (army) {

  var unitId = 2;
  var unitDepth = values.unitDepth;
  var units = [];

  function generateUnit (type, quantity, parent) {

      if (quantity === 0) {
      
        return;
      
      } else {

        var unit = {};
        
        unit.id = unitId;
        unit.type = type;

        if (parent) {
          unit.parentId = parent.id;
        } else if (type === "division") {
          unit.parentId = 1; //army id
        };

        unitId++;

        switch (type) {

          case "division":
            unit.brigades = [];
            unit.name = names.divisions[0];

            names.divisions.shift();
            army.divisions.push(unit);
            generateUnit("brigade", unitDepth, unit);
            generateUnit("division", quantity - 1, parent);
          break;

          case "brigade":
            unit.regiments = [];
            unit.name = names.brigades[0];

            names.brigades.shift();
            parent.brigades.push(unit);
            army.brigades.push(unit);

            generateUnit("regiment", unitDepth, unit);
            generateUnit("brigade", quantity - 1, parent);
          break;

          case "regiment":
            unit.companies = [];
            unit.name = names.regiments[0];

            names.regiments.shift();
            parent.regiments.push(unit);
            army.regiments.push(unit);

            generateUnit("company", unitDepth, unit);
            generateUnit("regiment", quantity - 1, parent);
          break;

          case "company":
            unit.battalions = [];
            unit.name = names.companies[0];

            names.companies.shift();
            parent.companies.push(unit);
            army.companies.push(unit);

            generateUnit("battalion", unitDepth, unit);
            generateUnit("company", quantity - 1, parent);
          break;

          case "battalion":
            unit.name = names.battalions[0];

            names.battalions.shift();
            parent.battalions.push(unit);
            army.battalions.push(unit);

            generateUnit("battalion", quantity - 1, parent);
          break;

        };

        units.push(unit);

      };

    };

    generateUnit("division", unitDepth);

  return army;

};