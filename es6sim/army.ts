'use strict';
import HQ from './hq';
import Unit from './unit';
import World from './world';
import config from './config';
import ArmyDef from './typings'

class Army {
  HQ: ArmyDef.HQ;
  _unitsId: number;
  units: any;
  id: number;

  constructor () {
    this.HQ = new HQ();

    this._unitsId = 0;
    this.units = {
      corps: []
    };

    this.id = 0;
    this.generate('corp', config.unitDepth);
    this.HQ.units.sort(function(a, b) {return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0);} );
  }

  generate (type, quantity, parent?) {
    if (quantity === 0) {
      return;
    } else {
      let spec = {
        id: this._unitsId,
        type: type,
        parentId: undefined,
        rank: undefined
      };

      let unit: ArmyDef.Unit = {};
      this._unitsId++;
      spec.parentId = parent ? parent.id : undefined;

      switch (type) {
        case 'corp':
          spec.rank = 'lgeneral';
          unit = new Unit(spec, this.HQ);
          this.units.corps.push(unit);

          this.generate('division', config.unitDepth, unit);
          this.generate('corp', quantity - 1, parent);
        break;

        case 'division':
          spec.rank = 'dgeneral';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('brigade', config.unitDepth, unit);
          this.generate('division', quantity - 1, parent);
        break;

        case 'brigade':
          spec.rank = 'bgeneral';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('regiment', config.unitDepth, unit);
          this.generate('brigade', quantity - 1, parent);
        break;

        case 'regiment':
          spec.rank = 'coronel';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('battalion', config.unitDepth, unit);
          this.generate('regiment', quantity - 1, parent);
        break;

        case 'battalion':
          spec.rank = 'lcoronel';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('company', config.unitDepth, unit);
          this.generate('battalion', quantity - 1, parent);
        break;

        case 'company':
          spec.rank = 'major';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('platoon', config.unitDepth, unit);
          this.generate('company', quantity - 1, parent);
        break;

        case 'platoon':
          spec.rank = 'captain';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('squad', config.unitDepth, unit);
          this.generate('platoon', quantity - 1, parent);
        break;

        case 'squad':
          spec.rank = 'lieutenant';
          unit = new Unit(spec, this.HQ);
          parent.subunits.push(unit);

          this.generate('squad', quantity - 1, parent);
        break;
      }

      this.HQ.add(unit);

    }
  }
}

export default Army;
