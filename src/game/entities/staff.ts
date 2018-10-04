import { Headquarter } from './army'
import { Window } from './game'
import { Logger } from './logger'
import { Officer } from './officer'
import { Rank } from './rank'
import { Unit } from './unit'

export interface Chiefs {
  personnel: Officer,
  operations: Officer,
  investigations: Officer,
  intelligence: Officer,
  logistics: Officer,
  communications: Officer,
  arsenals: Officer,
  doctrine: Officer,
  finance: Officer,
}

export class Staff {
  OFFICERID = 0
  reserve: Officer[] = []
  active: Officer[] = []
  log: Logger
  hq: Headquarter
  procer: Officer
  chiefs: {
    personnel: Officer,
    logistics: Officer,
  }

  constructor (hq: Headquarter) {
    this.log = new Logger(hq)
    this.hq = hq
  }

  retire (officer: Officer): Officer {
    officer.inReserve = true
    this.reserve.push(officer)
    this.active = this.active.filter((o) => officer.id !== o.id)

    this.replace(officer)

    officer.events.push(this.log.retire())

    this.isProcer(officer)

    return officer
  }

  recruit (tier: number): Officer {
    const recruit = new Officer(tier, this.hq)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.active.push(recruit)
    recruit.events.push(this.log.promote(recruit.rank.name()))
    return recruit
  }

  assign (officer: Officer, unit: Unit): Officer {
    unit.officer = officer
    officer.unit = unit
    return officer
  }

  // replace does a recursion that finds the subordinate
  // with highest experience and replaces all the
  // way down to recruiting a new liteutenant. in
  // the way down it also promotes. so if it replaces
  // a major it looks for the senior captain and promotes
  // it and replaces it with the senior lieutenant
  // and recruit a new lieutenant
  private replace (officer: Officer): Officer {
    let replacement: Officer

    if (officer.rank.tier === this.hq.LEVELS_BELOW_DIVISION) {
      replacement = this.recruit(this.hq.LEVELS_BELOW_DIVISION)
    } else {
      replacement = this.getReplacement(officer)

      this.replace(replacement)
      this.promote(replacement)
    }

    this.assign(replacement, officer.unit)

    return replacement
  }

  private getReplacement (officer: Officer): Officer {
    const subunits = officer.unit.subunits
    const officer1 = subunits[0].officer
    const officer2 = subunits[1].officer
    return officer1.experience > officer2.experience ? officer1 : officer2
  }

  private promote (officer: Officer): Officer {
    officer.rank = new Rank(officer.rank.tier + 1)
    officer.events.push(this.log.promote(officer.rank.name()))
    officer.getNewTrait()
    return officer
  }

  private isProcer (officer: Officer): Officer {
    if (!this.procer || officer.prestige > this.procer.prestige) this.procer = officer
    return this.procer
  }
}
