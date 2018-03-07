import * as moment from 'moment'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Headquarter } from '../entities/army'
import { Officer } from '../entities/officer'
import { Operation } from '../entities/operation'
import { Unit } from '../entities/unit'
import { Game } from '../game'
import { constants } from '../util'

export class UIMain extends React.Component {
  props: {
    game: Game,
  }

  render () {
    return <div className='army'>
      <h1>{ moment().add(this.props.game.turn, 'days').format('YYYY-MM-DD')}</h1>
      <div className='officer'>
        <UIOfficer officer={this.props.game.headquarter.inspected}/>
      </div>
      <div className='officer procer'>
        <UIOfficer officer={this.props.game.headquarter.staff.procer}/>
      </div>
      <div className='clear'></div>
      <div className='units'>
        <UIUnit hq={this.props.game.headquarter} unit={this.props.game.headquarter.army} game={this.props.game}/>
      </div>
    </div>
  }
}

export class UIOfficer extends React.Component {
  props: {
    officer: Officer,
  }

  getOperation (operation: Operation) {
    return <div className='operationItem'>
      <ul>
        <li>Status:     {operation.status.toUpperCase()}</li>
        <li>Name:       {operation.name}</li>
        <li>Type:       {operation.type}</li>
        <li>Logged:     {operation.logged}</li>
        <li>Stength:    {operation.strength}</li>
        <li>Target:     {operation.target.fullName()}</li>
        <li>Started as: {operation.metadata.startedAs}</li>
        <li>Against a:  {operation.metadata.againstA}</li>
        {/*<li>Because:    {operation.metadata.because}</li>*/}
      </ul>
    </div>
  }

  render () {
    const o = this.props.officer

    if (!o) return <div></div>

    const events: string[] = []

    o.events.forEach((event) => {
      events.push(<div>{event}</div>)
    })

    const operations: string[] = []

    o.operations.forEach((operation) => {
      operations.push(this.getOperation(operation))
    })

    return <div>
      <ul>
        <li>{o.fullName()}</li>
        <li>Experience: {o.experience}</li>
        <li>Prestige: {o.prestige}</li>
        <li>Faction: {o.faction.type}</li>
        <li>Senior: {o.isSenior() ? 'Yes' : 'No'}</li>
        <li>Passed for promotion: {o.isPassedForPromotion() ? 'Yes' : 'No'}</li>
        <li>-</li>
        <li>{events}</li>
        <li>-</li>
        <li className='operationList'>{operations}</li>
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

    const faction = this.props.unit.officer.faction.type.toLowerCase() + 'Faction'

    const selected = (
      this.props.hq.inspected &&
      (this.props.unit.officer.id === this.props.hq.inspected.id)
    ) ? 'selected' : ''

    return <div onClick={this.inspect} className={selected + ' ' + faction}>
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
