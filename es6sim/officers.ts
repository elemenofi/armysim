'use strict';
import config from './config';
import Officer from './officer';
import Secretary from './secretary';
import Player from './player';
import Army from './typings';

interface ReplaceSpec {
  aggresor?: Army.Officer;
  replacedCommander: Army.Officer;
  unitId: number;
  rank: Army.Rank;
  rankToPromote: string;
  HQ: Army.HQ;
}

class Officers implements Army.Officers {
  realDate: string;
  active: Officer[];
  pool: Officer[];
  officers: Army.Officers;
  inspected: Officer;
  __officersID: number;
  secretary: Army.Secretary;
  player: Officer;
  operations: Army.Operation[];

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

  recruit (rank: string, unitId: number, isPlayer: boolean, unitName: string) {
    let options = {
      date: this.realDate,
      id: this.officers.__officersID,
      unitId: unitId,
      rankName: rank
    };

    let cadet = (isPlayer) ? new Player(options, this, unitName) : new Officer(options, this, unitName);

    if (isPlayer) this.player = cadet;

    this.officers.active[cadet.id] = cadet;
    this.officers.pool.push(cadet);
    this.officers.__officersID++;
    return cadet;
  }

  replace (replacedCommander: Army.Officer) {
    let lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);

    let spec = {
      aggresor: (replacedCommander.reason) ? replacedCommander.reason.officer : undefined,
      replacedCommander: replacedCommander,
      unitId: replacedCommander.unitId,
      rank: replacedCommander.rank.alias,
      rankToPromote: lowerRank,
      HQ: this
    };

    if (lowerRank) {
      return this.officers.candidate(spec);
    } else {
      return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
    }
  }

  replaceForPlayer (replacedCommander: Army.Officer) {
    return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
  }

  candidate (spec: ReplaceSpec) {
    // let candidate = this.active
    //   .filter(officer => { return officer.rank.alias === spec.rankToPromote && spec.HQ.findUnitById(officer.unitId).parentId === spec.unitId; })
    //   .reduce((prev, curr) => (curr.experience > prev.experience) ? curr : prev);
    let candidate = spec.HQ.units[spec.replacedCommander.unitId].subunits[0].commander
    let candidateB = spec.HQ.units[spec.replacedCommander.unitId].subunits[1].commander

    candidate = (candidate.experience > candidateB.experience) ? candidate : candidateB;

    if (spec.aggresor && !spec.aggresor.reserved && spec.replacedCommander.rank.hierarchy === spec.aggresor.rank.hierarchy + 1) {
      candidate = spec.aggresor
    }
    return this.promote(candidate, spec);
  }

  promote (officer: Army.Officer, spec: any) {
    spec.HQ.deassign(officer.unitId);
    let promotion = this.promotion(officer, spec);
    officer.history.push(config.promoted(promotion));
    return officer;
  }

  promotion (officer: Army.Officer, spec: any) {
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
