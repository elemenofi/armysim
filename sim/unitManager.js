var globalUnitId = 2;

var names = require('./names.js');

exports.initArmy = function (army) {

  function generateUnit (type, quantity, parentId) {
    if (quantity === 0) {
      return;
    } else {
      for (var i = 0; i < quantity; i++) {
        var unit = {};
        unit.id = globalUnitId;
        globalUnitId++;

        switch (type) {
          case "division":
            unit.name = names.divisions[0];
            names.divisions.shift();

            army.divisions.push(unit);

            generateUnit("brigade", 2, unit.id);
          break;

          case "brigade":
            unit.name = names.brigades[0];
            names.brigades.shift();

            unit.parentId = parentId;

            army.brigades.push(unit);

            generateUnit("regiment", 2, unit.id);
          break;

          case "regiment":
            unit.name = names.regiments[0];
            names.regiments.shift();

            unit.parentId = parentId;

            army.regiments.push(unit);

            generateUnit("company", 2, unit.id);
          break;

          case "company":
            unit.name = names.companies[0];
            names.companies.shift();

            unit.parentId = parentId;

            army.companies.push(unit);

            generateUnit("battalion", 2, unit.id);
          break;

          case "battalion":
            unit.name = names.battalions[0];
            names.battalions.shift();

            unit.parentId = parentId;

            army.battalions.push(unit);
          break;
        }
      }
    }
  }

  generateUnit("division", 2);

  return army;
}