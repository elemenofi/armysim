'use strict';
import names from './names';
class Unit {
  constructor (spec, HQ) {
    this.id = spec.id;
    this.parentId = spec.parentId;
    this.type = spec.type;
    this.name = names[spec.type][0];
    names[spec.type].shift();
    this.subunits = [];
    this.reserve = [];
    this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
  }
}

export default Unit;
