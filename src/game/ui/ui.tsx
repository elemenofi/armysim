import * as moment from 'moment'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Headquarter } from '../entities/army'
import { Game } from '../entities/game'
import { Officer } from '../entities/officer'
import { Operation } from '../entities/operation'
import { Unit } from '../entities/unit'
import { constants } from '../entities/util'

export class UI extends React.Component {
  render (game:   Game) {
    ReactDOM.render(
      <UIMain game={game} />,
      document.getElementById('game'),
    )
  }
}

export class UIMain extends React.Component {
  props: {
    game: Game,
  }

  render () {
    const game = this.props.game
    const hq = game.headquarter
    const scores = hq.staff.scores

    return <div className='army'>
      <h1>
        { moment().add(game.turn, 'days').format('YYYY-MM-DD')}&nbsp;
        RIGHT WING: {scores.rightFaction} / {scores.rightFactionAmount}&nbsp;
        LEFT WING: {scores.leftFaction} / {scores.leftFactionAmount}
      </h1>
      <div className='officer'>
        <h2>Inspected officer:</h2>
        <UIOfficer officer={hq.inspected}/>
      </div>
      <div className='officer procer'>
        <h2>Most highly decorated:</h2>
        <UIOfficer officer={hq.staff.procer}/>
      </div>
      <div className='clear'></div>
      <div className='units'>
        <UIUnit hq={hq} unit={hq.army} game={game}/>
      </div>
    </div>
  }
}

export class UIUnit extends React.Component {
  props:   {
    unit:   Unit
    hq: Headquarter,
    game: Game,
  }

  constructor () {
    super()
    this.inspect = this.inspect.bind(this)
  }

  label (tier: number): {label:   string, size: string} {
    return constants.label(tier)
  }

  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.props.hq.inspect(this.props.unit.officer)
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

export class UIOfficer extends React.Component {
  props:   {
    officer:   Officer,
  }

  getOperation (operation: Operation) {
    return <UIOperation operation={operation} />
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

    const traits: string[] = []

    o.traits.forEach((trait) => {
      traits.push(<li>{trait.name}</li>)
    })

    return <div>
      <ul className='officerData'>
        <li>{o.fullName()}</li>
        <li>Experience: {o.experience}</li>
        <li>Prestige: {o.prestige}</li>
        <li>Commanding: {o.getTotalTraitValue('commanding')}</li>
        <li>Diplomacy: {o.getTotalTraitValue('diplomacy')}</li>
        <li>Espionage: {o.getTotalTraitValue('intelligence')}</li>
        <li>Skill: {o.getTotalTraitsValue()}</li>
        <li>Faction: {o.faction.type}</li>
        <li>Senior: {o.isSenior() ? 'Yes' : 'No'}</li>
        <li>Passed for promotion: {o.isPassedForPromotion() ? 'Yes' : 'No'}</li>
        <li>-</li>
        <li>{events}</li>
        <li>-</li>
      </ul>
      <ul className='officerTraits'>
        {traits}
      </ul>
      <div className='clear'></div>
      <div className='operationList'>{operations}</div>
    </div>
  }
}

export class UIOperation extends React.Component {
  props: {
    operation: Operation,
  }

  state: {
    open: boolean,
  }

  constructor () {
    super()
    this.state = {
      open: false,
    }
    this.inspect = this.inspect.bind(this)
  }

  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    super.setState({open: !this.state.open})
  }

  render () {
    const operation = this.props.operation

    const content = (this.state.open)
      ? <ul className='operationInfo'>
        <li>{operation.logged} {operation.status.toUpperCase()}</li>
        <li>Stength:    {operation.strength}</li>
        <li>Type:       {operation.type}</li>
        <li>Faction:    {operation.officer.faction.type}</li>
        <li>Started as: {operation.startedAs}</li>
        <li>Against a:  {operation.againstA}</li>
        <li>Target:     {operation.target.fullName()}</li>
        {/*<li>Because:    {operation.metadata.because}</li>*/}
      </ul>
      : <div></div>

    return <div className='operationItem' onClick={this.inspect}>
      <div>{operation.started} {operation.name}</div>
      {content}
    </div>
  }
}
