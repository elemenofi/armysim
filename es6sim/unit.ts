'use strict';
import names from './names';
import Officer from './officer';
import HQ from './HQ'

class Unit {
  id: number;
  parentId: number;
  type: string;
  name: string;
  subunits?: Unit[];
  reserve: Officer[];
  commander: Officer;

  constructor (spec: any, HQ: HQ) {
    this.id = spec.id;
    this.parentId = spec.parentId;
    this.type = spec.type;
    this.name = names[spec.type][0];
    names[spec.type].shift();
    this.reserve = [];
    this.subunits = [];
    this.commander = HQ.recruit(spec.rank, this.id, false, this.name);
  }
}

export default Unit;
