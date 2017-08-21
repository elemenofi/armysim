'use strict';
import config from './config';
import {Officer, Rank} from './officer';
import HQ from './HQ'
import Operation from './operations'
import Secretary from './secretary';
import Player from './player';

interface ReplaceSpec {
  aggresor?: Officer;
  replacedCommander: Officer;
  unitId: number;
  rank: string;
  rankToPromote: string;
  HQ: HQ;
}

class Officers implements Officers {
  realDate: string;
  active: Officer[];
  pool: Officer[];
  officers: Officers;
  inspected: Officer;
  __officersID: number;
  secretary: Secretary;
  player: Officer;
  operations: Operation[];

  constructor () {
    this.pool = [];
    this.active = [];
    this.__officersID = 1;
    this.secretary = new Secretary();
    this.player = undefined;
    this.inspected = undefined;
  }

  update (HQ) {
    this.active.forEach(officer => { if (officer) officer.update(HQ); });
  }

  candidate (spec: ReplaceSpec) {
    let parentUnit = spec.HQ.units[spec.replacedCommander.unitId]
    let candidate = parentUnit.subunits[0].commander
    let candidateB = parentUnit.subunits[1].commander

    candidate = (candidate.experience > candidateB.experience) ? candidate : candidateB;
    // if the retirement of the previous office was because of an operation then the planner will be the promoted one if it is only
    // one rank below
    if (
      spec.aggresor &&
      !spec.aggresor.reserved &&
      spec.replacedCommander.rank.hierarchy === spec.aggresor.rank.hierarchy + 1
    ) {
      candidate = spec.aggresor
    }
    return this.promote(candidate, spec);
  }

  promote (officer: Officer, spec: any) {
    spec.HQ.deassign(officer.unitId);
    let promotion = this.promotion(officer, spec);
    officer.history.events.push(config.promoted(promotion, spec.HQ));
    officer.targets = [];
    officer.commander = undefined;
    return officer;
  }

  promotion (officer: Officer, spec: any) {
    officer.unitId = spec.unitId;
    officer.rank = config.ranks[spec.rank];

    return {
      rank: spec.rank,
      date: config.formatDate(spec.HQ.rawDate),
      unit: spec.HQ.unitName(officer.unitId)
    };
  }
}

export default Officers;
