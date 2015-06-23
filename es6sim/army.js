/* jshint ignore:start */
import config from './config';
import names from './names';
import Unit from './unit';
import Officers from './officers';
import HQ from './hq';

class Army {
  constructor () {
    this.HQ = new HQ();
    this.HQ.officers = new Officers(this.HQ);

    this._unitId = 2;
    this.units = {
      corps: []
    };

    this.id = 1;
    this.generate("corp", config.unitDepth);
  }

  generate (type, quantity, parent) {
    if (quantity === 0) {
      return;
    } else {
      let unit = new Unit();

      unit.id = this._unitId;
      this._unitId++;

      unit.type = type;

      if (parent) {
        unit.parentId = parent.id;
      } else {
        unit.parentId = 1;
      }

      switch (type) {
        case "corp":
          unit.name = names.corps[0];
          names.corps.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('lgeneral', unit.id);

          this.units.corps.push(unit);

          this.generate("division", config.unitDepth, unit);
          this.generate("corp", quantity - 1, parent);
        break;

        case "division":
          unit.name = names.divisions[0];
          names.divisions.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('dgeneral', unit.id);

          parent.subunits.push(unit);

          this.generate("brigade", config.unitDepth, unit);
          this.generate("division", quantity - 1, parent);
        break;

        case "brigade":
          unit.name = names.brigades[0];
          names.brigades.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('bgeneral', unit.id);

          parent.subunits.push(unit);

          this.generate("regiment", config.unitDepth, unit);
          this.generate("brigade", quantity - 1, parent);
        break;

        case "regiment":
          unit.name = names.regiments[0];
          names.regiments.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('coronel', unit.id);

          parent.subunits.push(unit);

          this.generate("battalion", config.unitDepth, unit);
          this.generate("regiment", quantity - 1, parent);
        break;

        case "battalion":
          unit.name = names.battalions[0];
          names.battalions.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('lcoronel', unit.id);

          parent.subunits.push(unit);

          this.generate("company", config.unitDepth, unit);
          this.generate("battalion", quantity - 1, parent);
        break;

        case "company":
          unit.name = names.companies[0];
          names.companies.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('major', unit.id);

          parent.subunits.push(unit);

          this.generate("platoon", config.unitDepth, unit);
          this.generate("company", quantity - 1, parent);
        break;

        case "platoon":
          unit.name = names.platoons[0];
          names.platoons.shift();
          unit.subunits = [];
          unit.commander = this.HQ.officers.recruit('captain', unit.id);

          parent.subunits.push(unit);

          this.generate("squad", config.unitDepth, unit);
          this.generate("platoon", quantity - 1, parent);
        break;

        case "squad":
          unit.name = names.squads[0];
          names.squads.shift();
          unit.commander = this.HQ.officers.recruit('lieutenant', unit.id);

          parent.subunits.push(unit);

          this.generate("squad", quantity - 1, parent);
        break;
      };

      this.HQ.add(unit);
    }
  }
}

export default Army;
