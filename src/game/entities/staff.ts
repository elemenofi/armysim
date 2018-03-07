import { Logger } from '../logger'
import { Headquarter } from './army'
import { FactionNames } from './faction'
import { Officer } from './officer'
import { Rank } from './rank'
import { Unit } from './unit'

export class Staff {
  OFFICERID = 0
  reserve: Officer[] = []
  active: Officer[] = []
  log: Logger
  hq: Headquarter
  procer: Officer
  scores: { rightFaction: number, leftFaction: number} = {
    rightFaction: 0,
    leftFaction: 0,
  }

  constructor (hq: Headquarter) {
    this.log = new Logger()
    this.hq = hq
  }

  setScores (): void {
    const reducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.right) {
        return accumulator + currentValue.prestige
      }
      return accumulator
    }

    const leftReducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.left) {
        return accumulator + currentValue.prestige
      }
      return accumulator
    }

    this.scores.rightFaction = Math.max(0, this.active.reduce(reducer, 0))
    this.scores.leftFaction = Math.max(0, this.active.reduce(leftReducer, 0))
  }

  retire (officer: Officer): Officer {
    officer.inReserve = true
    this.reserve.push(officer)
    this.active = this.active.filter((o) => officer.id !== o.id)

    this.replace(officer)

    officer.events.push(
      (officer.forcedToRetireBy)
        ? this.log.forcedRetirement(officer.forcedToRetireBy)
        : this.log.retire(),
    )

    this.checkMerit(officer)

    return officer
  }

  // replace does a recursion that finds the subordinate
  // with highest experience and replaces all the
  // way down to recruiting a new liteutenant. in
  // the way down it also promotes. so if it replaces
  // a major it looks for the senior captain and promotes
  // it and replaces it with the senior lieutenant and
  // and recruit a new lieutenant
  replace (officer: Officer): Officer {
    let replacement: Officer

    if (officer.rank.tier === 1) {
      replacement = this.recruit(1)
    } else {
      replacement = this.getReplacement(officer)

      this.replace(replacement)
      this.promote(replacement)
    }

    this.assign(replacement, officer.unit)

    return replacement
  }

  getReplacement (officer: Officer): Officer {
    const subunits = officer.unit.subunits
    const officer1 = subunits[0].officer
    const officer2 = subunits[1].officer
    return officer1.experience > officer2.experience ? officer1 : officer2
  }

  recruit (tier: number): Officer {
    const recruit = new Officer(tier, this.hq)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.active.push(recruit)
    recruit.events.push(this.log.promote(recruit.rank.name()))
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

  private checkMerit (officer: Officer): Officer {
    if (!this.procer) this.procer = officer
    if (officer.prestige > this.procer.prestige) this.procer = officer
    return this.procer
  }
}
