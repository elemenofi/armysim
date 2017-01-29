'use strict';
import names from './names';
import Army from './typings'

class Unit implements Army.Unit {
  id: number;
  parentId: number;
  type: string;
  name: string;
  subunits: [Army.Unit, Army.Unit];
  reserve: Army.Officer[];
  commander: Army.Officer;

  constructor (spec: any, HQ: Army.HQ) {
    this.id = spec.id;
    this.parentId = spec.parentId;
    this.type = spec.type;
    this.name = names[spec.type][0];
    names[spec.type].shift();
    this.reserve = [];
    this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
  }
}

export default Unit;
