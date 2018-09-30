import { Officer } from './officer'
import { Headquarter } from './army';
import { store } from './store'
import { Subject } from 'rxjs/Subject'
import { Logger } from './logger';
import { Window } from './game'
import * as React from 'react'
import { UIClickableOfficer } from '../ui/ui';
declare const window: Window

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
}

export interface OrderOption {
  text: string
  handler: () => void
}

export class Order {
  options: OrderOption[]
  title: string
  description: string
  data$: Subject<any>
  value: any
  date: string
  orderNumber: number

  constructor (content, options, date, data$, orderNumber, value?) {
    this.title = content.title
    this.description = content.description
    this.data$ = data$
    this.options = options
    this.value = value
    this.orderNumber = orderNumber
    this.date = date
  }
}

export class CommandAndControl {
  hq: Headquarter
  log: Logger
  visibleOrder: Order

  constructor (hq: Headquarter) {
    this.hq = hq
    this.log = new Logger(hq)
  }

  closeOrder (sub) {
    this.visibleOrder = undefined
    sub.unsubscribe()
  }

  async createPlayerOfficer () {
    const officer = this.hq.army.officer
    this.hq.player = officer
    await this.assignPlayer(officer)
  }

  assignPlayer (officer: Officer) {
    return new Promise ((res, rej) => {
      officer.isPlayer = true
      officer.name = store.playerName

      const nameChange$ = new Subject()
      const nameChangeSub = nameChange$
        .subscribe((name: string) => {
          officer.name = name
          store.playerName = name
          res(name)
        })

      const orderIdentifier = 'firstOrder'

      this.visibleOrder = new Order(
        orders[orderIdentifier],
        [
          {
            text: 'Sign',
            handler: () => {
              // this might be buggy because when we submit this order
              // there might be a different one in HQ.
              // orders should be a stack. OrderService or so. the one in the hq was there
              this.closeOrder(nameChangeSub)
              window.game.advance()
            },
          },
        ],
        this.log.day(),
        orderIdentifier,
        nameChange$,
        store.state.playerName,
      )
    })
  }
}

export class UIOrder extends React.Component {
  props: {
    order: Order,
  }

  state: {
    value: string,
  }

  constructor (props) {
    super()
  }

  render () {
    const body = <div></div>
    return <div>
      {body}
    </div>
  }
}
