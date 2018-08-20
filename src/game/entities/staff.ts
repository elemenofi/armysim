import { debounce, debounceTime, take } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'
import { Headquarter, Order } from './army'
import { FactionNames } from './faction'
import { Window } from './game'
import { Logger } from './logger'
import { Officer } from './officer'
import { Operation } from './operation'
import { orders } from './orders'
import { Rank } from './rank'
import { store } from './store'
import { traitsService } from './traits'
import { Unit } from './unit'
declare const window: Window

export interface Scores {
  rightFaction: number,
  rightFactionAmount: number,
  leftFaction: number,
  leftFactionAmount: number,
}

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
  scores: Scores
  chiefs: {
    personnel: Officer,
  }

  constructor (hq: Headquarter) {
    this.log = new Logger()
    this.hq = hq
  }

  setScores (): void {
    const reducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.right && currentValue.rank.tier > 4) {
        return accumulator + currentValue.prestige
      }
      return accumulator
    }

    const leftReducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.left && currentValue.rank.tier > 4) {
        return accumulator + currentValue.prestige
      }
      return accumulator
    }

    const rightCountReducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.right) {
        return accumulator + 1
      }
      return accumulator
    }

    const leftCountReducer = (accumulator, currentValue: Officer) => {
      if (currentValue.faction.type === FactionNames.left) {
        return accumulator + 1
      }
      return accumulator
    }

    this.scores = {
      rightFaction: Math.max(0, this.active.reduce(reducer, 0)),
      leftFaction: Math.max(0, this.active.reduce(leftReducer, 0)),
      rightFactionAmount: Math.max(0, this.active.reduce(rightCountReducer, 0)),
      leftFactionAmount: Math.max(0, this.active.reduce(leftCountReducer, 0)),
    }
  }

  retire (officer: Officer): Officer {
    officer.inReserve = true
    this.reserve.push(officer)
    this.active = this.active.filter((o) => officer.id !== o.id)

    this.replace(officer)

    officer.events.push(
      // this.log.retire(),
      // for now i will just always log it as a normal retirement to conceal it from the player
      (officer.forcedToRetireBy)
        ? this.log.forcedRetirement(officer.forcedToRetireBy)
        : this.log.retire(),
    )

    this.checkIfProcer(officer)

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

  coup (operation: Operation): void {
    this.active.forEach((o) => {
      if (!o.resistsCoup(operation.officer.faction.type)) {
        o.forcedToRetireBy = operation
        this.retire(o)
      }
    })
  }

  assignChiefs () {
    const newChiefOfPersonnel$ = new Subject()
    const newChiefOfPersonnelSub = newChiefOfPersonnel$
      .subscribe((chief: Officer) => {
        this.chiefs.personnel = chief
        newChiefOfPersonnelSub.unsubscribe()
      })

    this.hq.order = new Order(
      orders.chief['personnel'],
      [
        {
          text: 'Sign',
          handler: () => {
            // this might be buggy because when we submit this order
            // there might be a different one in HQ.
            // orders should be a stack. OrderService or so. the one in the hq was there
            this.hq.order = undefined
            window.game.pause()
          },
        },
      ],
      this.log.day(),
      newChiefOfPersonnel$,
    )
  }

  async createPlayerOfficer () {
    const officer = this.hq.army.officer
    this.hq.player = officer
    this.hq.staff.assignPlayer(officer)
  }

  assignPlayer (officer: Officer) {
      officer.isPlayer = true
      officer.name = store.playerName
      this.hq.inspected = officer

      const nameChange$ = new Subject()
      const nameChangeSub = nameChange$
        .subscribe((name: string) => {
          officer.name = name
          store.playerName = name
          nameChangeSub.unsubscribe()
        })

      this.hq.order = new Order(
        orders.firstOrder,
        [
          {
            text: 'Sign',
            handler: () => {
              // this might be buggy because when we submit this order
              // there might be a different one in HQ.
              // orders should be a stack. OrderService or so. the one in the hq was there
              this.hq.order = undefined
              window.game.pause()
            },
          },
        ],
        this.log.day(),
        nameChange$,
        store.state.playerName,
      )
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

  private checkIfProcer (officer: Officer): Officer {
    if (!this.procer) this.procer = officer
    if (officer.prestige > this.procer.prestige) this.procer = officer
    return this.procer
  }
}
