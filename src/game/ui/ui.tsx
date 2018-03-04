import * as moment from 'moment'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Game, Headquarter, Officer, Unit } from '../entities/army'
import { constants } from '../util'

export class UIMain extends React.Component {
  props: {
    game: Game,
  }

  render () {
    return <div className='army'>
      <h1>{ moment().add(this.props.game.turn, 'days').format('YYYY-MM-DD')}</h1>
      <UIOfficer officer={this.props.game.headquarter.inspected}/>
      <UIUnit hq={this.props.game.headquarter} unit={this.props.game.headquarter.army} game={this.props.game}/>
    </div>
  }
}

export class UIOfficer extends React.Component {
  props: {
    officer: Officer,
  }

  render () {
    const o = this.props.officer

    if (!o) return <div>Click on an officer to inspect it</div>

    const events: string[] = []

    o.events.forEach((event) => {
      events.push(<div>{event}</div>)
    })

    const operations: string[] = []

    o.operations.forEach((operation) => {
      operations.push(<div>{operation.name} {operation.strength}</div>)
    })

    return <div>
      <ul>
        <li>{o.fullName()}</li>
        <li>Experience: {o.experience}</li>
        <li>Prestige: {o.prestige}</li>
        <li>{events}</li>
        <li>{operations}</li>
      </ul>
    </div>
  }
}

export class UIUnit extends React.Component {
  props: {
    unit: Unit
    hq: Headquarter,
    game: Game,
  }

  constructor () {
    super()
    this.inspect = this.inspect.bind(this)
  }

  label (tier: number): {label: string, size: string} {
    return constants.label(tier)
  }

  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.props.hq.inspected = this.props.unit.officer
    this.props.game.advance()
  }

  subunits () {
    const hq = this.props.hq
    const u = this.props.unit
    const su = u.subunits
    const size = 'unit-' + this.label(u.tier).size

    return <div className='unit-sub'>
      <div className={size}>
        <UIUnit hq={hq} unit={su[0]} game={this.props.game}/>
      </div>
      <div className={size}>
        <UIUnit hq={hq} unit={su[1]} game={this.props.game}/>
      </div>
    </div>
  }

  render () {
    const u = this.props.unit

    const subunits = (u.subunits.length)
      ? this.subunits() : undefined

    return <div onClick={this.inspect}>
      {this.label(u.tier).label}
      {subunits}
    </div>
  }
}

export class UI extends React.Component {
  render (game: Game) {
    ReactDOM.render(
      <UIMain game={game} />,
      document.getElementById('game'),
    )
  }
}
