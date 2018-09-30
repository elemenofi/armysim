import { Officer } from './officer'
import { Headquarter, Order } from './army';
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

      this.visibleOrder = new Order(
        orders.firstOrder,
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
        nameChange$,
        1,
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

  nameInput

  constructor (props) {
    super()
  }

  componentWillMount () {
    super.setState({value: this.props.order.value })
  }

  componentDidMount () {
    this.nameInput.focus()
  }

  handleChange (event) {
    super.setState({value: event.target.value})
  }

  onSubmit (handle) {
    if (this.props.order.orderNumber === 1) this.props.order.data$.next(this.state.value)
    handle()
  }

  render () {
    const order = this.props.order
    let body = <div></div>
    let inputBox = <div></div>
    let officerList = <div></div>
    const options = []

    if (order) {
      this.props
        .order
        .options
        .forEach((o) => {
          options.push(
            <li key={o.text}>
              <button
                onClick={this.onSubmit.bind(this, o.handler)}
                ref={(input) => { this.nameInput = input }}
              >
                {o.text}
              </button>
            </li>,
          )
        })

      if (order.orderNumber === 1) {
        inputBox = <input type='text' value={this.state.value} onChange= {this.handleChange.bind(this)}></input>
      }

      if (order.orderNumber === 2) {
        officerList = []
        this.props.order.value.forEach((o: Officer) => {
          officerList.push(<UIClickableOfficer key={o.name} officer={o} promise={this.props.order.data$}/>)
        })
      }

      body = <div className='order'>
        <strong><h4>ORDER#{order.orderNumber} {order.date}</h4></strong>
        <h4>{order.title}</h4>
        <div dangerouslySetInnerHTML={{__html: order.description}}></div>
        <div>
          {inputBox}
        </div>
        <ul>
          {options}
        </ul>
        <ul>
          {officerList}
        </ul>
      </div>
    }

    return <div>
      {body}
    </div>
  }
}
