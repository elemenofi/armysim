/* jshint ignore:start */
import config from './config';
import names from './names';
import Unit from './unit';

class Army {
  constructor (officers) {
    this.unitId = 2;
    this.unitDepth = config.unitDepth;
    this.officers = officers;
    this.units = {
      corps: []
    };

    this.generate("corp", this.unitDepth); 
  }

  generate (type, quantity, parent) {
    if (quantity === 0) {
      return;
    } else {
      let unit = new Unit();
      
      unit.id = this.unitId;
      this.unitId++;
      
      unit.type = type;

      if (parent) {
        unit.parentId = parent.id;
      } else {
        unit.parentId = 1;
      }

      switch (type) {
        case "corp":
          unit.divisions = [];
          unit.name = names.corps[0];
          unit.commander = this.officers.recruit(100, unit.id);
          names.corps.shift();
          this.units.corps.push(unit);
          
          this.generate("division", this.unitDepth, unit);
          this.generate("corp", quantity - 1, parent);
        break;

        case "division":
          unit.brigades = [];
          unit.name = names.divisions[0];
          unit.commander = this.officers.recruit(80, unit.id);          
          names.divisions.shift();
          parent.divisions.push(unit);

          this.generate("brigade", this.unitDepth, unit);
          this.generate("division", quantity - 1, parent);
        break;

        case "brigade":
          unit.regiments = [];
          unit.name = names.brigades[0];
          unit.commander = this.officers.recruit(60, unit.id);
          names.brigades.shift();
          parent.brigades.push(unit);

          this.generate("regiment", this.unitDepth, unit);
          this.generate("brigade", quantity - 1, parent);
        break;

        case "regiment":
          unit.battalions = [];
          unit.name = names.regiments[0];
          unit.commander = this.officers.recruit(40, unit.id);
          names.regiments.shift();
          parent.regiments.push(unit);

          this.generate("battalion", this.unitDepth, unit);
          this.generate("regiment", quantity - 1, parent);
        break;

        case "battalion":
          unit.companies = [];
          unit.name = names.battalions[0];
          unit.commander = this.officers.recruit(30, unit.id);
          names.battalions.shift();
          parent.battalions.push(unit);

          this.generate("company", this.unitDepth, unit);
          this.generate("battalion", quantity - 1, parent);
        break;

        case "company":
          unit.platoons = [];
          unit.name = names.companies[0];
          unit.commander = this.officers.recruit(20, unit.id);
          names.companies.shift();
          parent.companies.push(unit);

          this.generate("platoon", this.unitDepth, unit);
          this.generate("company", quantity - 1, parent);
        break;

        case "platoon":
          unit.name = names.platoons[0];
          unit.commander = this.officers.recruit(10, unit.id);
          names.platoons.shift();
          parent.platoons.push(unit);

          this.generate("platoon", quantity - 1, parent);
        break;
      };
    }
  }
}

export default Army;

