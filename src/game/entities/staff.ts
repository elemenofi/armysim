import { Logger } from '../logger'
import { Headquarter } from './army'
import { Officer } from './officer'
import { Rank } from './rank'
import { Unit } from './unit'

export class Staff {
  OFFICERID = 0
  reserve: Officer[] = []
  active: Officer[] = []
  log: Logger
  hq: Headquarter

  constructor (hq: Headquarter) {
    this.log = new Logger()
    this.hq = hq
  }

  retire (officer: Officer): Officer {
    officer.events.push(this.hq.log.retire())
    this.reserve.push(officer)
    this.active = this.active.filter((o) => officer.id !== o.id)
    this.replace(officer)
    return officer
  }

  replace (replaced: Officer): Officer {
    let replacement: Officer

    if (replaced.rank.tier === 1) {
      replacement = this.recruit(1)
    } else {
      replacement = this.handleReplacement(replaced)
    }

    this.assign(replacement, replaced.unit)

    return replacement
  }

  recruit (tier: number): Officer {
    const recruit = new Officer(tier, this.hq)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.active.push(recruit)
    return recruit
  }

  promote (officer: Officer): Officer {
    officer.rank = new Rank(officer.rank.tier + 1)
    officer.events.push(this.log.promote(officer.rank.name()))
    return officer
  }

  assign (officer: Officer, unit: Unit): Officer {
    unit.officer = officer
    officer.unit = unit
    return officer
  }

  private handleReplacement (officer: Officer): Officer {
    const replacement = this.getReplacement(officer)

    this.replace(replacement)
    this.promote(replacement)

    return replacement
  }

  private getReplacement (officer: Officer): Officer {
    const subunits = officer.unit.subunits
    const officer1 = subunits[0].officer
    const officer2 = subunits[1].officer
    const replacement = officer1.experience > officer2.experience ? officer1 : officer2
    return replacement
  }
}
