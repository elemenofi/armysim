import { Officer } from './officer'
import { Headquarter, Order } from './army';
import { store } from './store'
import { Subject } from 'rxjs/Subject'
import { Logger } from './logger';


// tslint:disable:max-line-length
export const orders = {
  firstOrder: {
    title: `You have been promoted to Commander in Chief of the National Army:`,
    description: `
      <p>Congratulations General.</p>
      <p>The President is optimistic about the future but warns us about the dangers of extremist ideologies and sectarian rivalries. The Army should show society what order and discipline means. There can be no mistakes. It must be an example of public service and republicanism. We cannot allow autocratic elements to take control of our armed institutions.</p>
      <p>This document represents your promotion to the rank of General and your comission as Commander in Chief of the National Army. Your orders are to keep the Army functioning efficiently and to defend the Constitution.</p>
      <p>Sincerely,</br>
      John Stockenhaim</br>
      Minister of Defence</p>
    ` ,
  },
  chief: {
    personnel: () => {
      return {
        title: 'The Defense Minister wants you to select your cabinet.',
        description: `
        <p>Please choose a Chief of Personnel.</p>
        <p>The role of this officer is to manage all promotions and retirements.</p>
        `,
      }
    },
    logistics: () => {
      return {
        title: 'The Defense Minister wants you to select your cabinet.',
        description: `
        <p>Please choose a Chief of Logistics.</p>
        <p>The role of this officer is to manage the supply chain.</p>
        `,
      }
    },
  },
}

declare const window: Window

export class CommandAndControl {
  hq: Headquarter
  log: Logger

  constructor (hq: Headquarter) {
    this.hq = hq
    this.log = new Logger(hq)
  }

  closeOrder (sub) {
    this.hq.order = undefined
    sub.unsubscribe()
  }

  async createPlayerOfficer () {
    const officer = this.hq.army.officer
    this.hq.player = officer
    await this.assignPlayer(officer)
    await this.assignChiefs('personnel')
    await this.assignChiefs('logistics')
  }

  assignChiefs (chiefPosition: string) {
    return new Promise((res, rej) => {
      const officer$ = new Subject()
      const officerSub = officer$
        .subscribe((officer: Officer) => {
          res(officer)
          // coupled to staff.chiefs
          this.hq.staff.chiefs[chiefPosition] = officer
          this.closeOrder(officerSub)
        })

      this.hq.order = new Order(
        orders.chief[chiefPosition](),
        [
          {
            text: 'Sign',
            handler: () => {
              // this might be buggy because when we submit this order
              // there might be a different one in HQ.
              // orders should be a stack. OrderService or so. the one in the hq was there
              this.closeOrder(officerSub)
            },
          },
        ],
        this.log.day(),
        officer$,
        2,
        this.hq.staff.reserve.filter((o) => o.rank.tier > 7),
      )
    })
  }

  assignPlayer (officer: Officer) {
    return new Promise ((res, rej) => {
      officer.isPlayer = true
      officer.name = store.playerName
      this.hq.inspected = officer

      const nameChange$ = new Subject()
      const nameChangeSub = nameChange$
        .subscribe((name: string) => {
          officer.name = name
          store.playerName = name
          res(name)
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
              this.closeOrder(nameChangeSub)
              // ???? QPWQW)Q*W)*QW)*WQ)*QW!(&@(!@^(!(@))))
              window['game'].pause()
            },
          },
        ],
        this.log.day(),
        nameChange$,
        1,
        store.state.playerName,
      )
    })
  }
}
