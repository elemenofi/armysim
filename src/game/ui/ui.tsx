import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Draggable from 'react-draggable'
import { Subject } from 'rxjs/Subject'
import { Headquarter } from '../entities/army'
import { Game } from '../entities/game'
import { Officer } from '../entities/officer'
import { Operation } from '../entities/operation'
import { Unit } from '../entities/unit'
import { constants } from '../entities/util'
import { UIOrder } from '../entities/orders';

export class UI extends React.Component {
  render (game: Game) {
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

  constructor (props) {
    super()
  }

  eventLogger = (e: MouseEvent, data: Object) => {
    console.log('Event: ', e)
    console.log('Data: ', data)
  }

  onStart () {
  }

  onStop () {
  }

  render () {
    const dragHandlers = {onStart: this.onStart, onStop: this.onStop}
    const game = this.props.game
    const hq = game.headquarter
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + hq.turn)
    const chiefs = []
    const chiefsPanel = <div>
      <ul>
        {chiefs}
      </ul>
    </div>
    Object.keys(hq.staff.chiefs).forEach((chief: string) => {
      if (hq.staff.chiefs[chief]) {
        chiefs.push(<li key={chief}>{hq.staff.chiefs[chief].fullName()}</li>)
      }
    })

    return <div className='army'>
        <Draggable handle='strong' {...dragHandlers}>
          <div className='orders'>
            <UIOrder order={game.headquarter.cnc.visibleOrder}/>
          </div>
        </Draggable>
      <h1>
        { tomorrow.toISOString().slice(0, 10) }&nbsp;
        {/* RIGHT WING: {scores.rightFaction} / {scores.rightFactionAmount}&nbsp;
        LEFT WING: {scores.leftFaction} / {scores.leftFactionAmount} */}
      </h1>
      <div className='officer'>
        <UIOfficer officer={hq.player}/>
      </div>
      <div className='officer procer'>
        {chiefsPanel}
        <div className='clear'></div>
        <UIOfficer officer={hq.inspected}/>
      </div>
      <div className='clear'></div>
      <div className='units'>
        <UIUnit hq={hq} unit={hq.army} game={game}/>
      </div>
    </div>
  }
}

export class UIClickableOfficer extends React.Component {
  props: {
    officer: Officer
    destination: string,
    promise: Subject<Officer>,
  }
  constructor (props) {
    super(props)
  }
  select () {
    this.props.promise.next(this.props.officer)
  }
  render () {
    return <div onClick={this.select.bind(this)}>{this.props.officer.fullName()}</div>
  }
}

interface UnitProps {
  unit: Unit,
  hq: Headquarter,
  game: Game,
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

  // this observable is part of the officer because we want to
  // make it so that clicking in any operation closes the other one
  // owned by this officer that was already open
  officerOperationClicked: Subject<Operation>

  constructor () {
    super()
    this.officerOperationClicked = new Subject<Operation>()
  }

  getOperation (operation: Operation) {
    return <UIOperation
      operation={operation}
      officerOperationClicked={this.officerOperationClicked}
      key={operation.name}
    />
  }

  render () {
    const o = this.props.officer

    if (!o) return <div></div>

    // if (o.isPlayer) return <div>{o.fullName()}</div>

    const events: string[] = []

    o.events.forEach((event) => {
      events.push(<div key={event}>{event}</div>)
    })

    const operationsRecord: string[] = []

    o.operationsRecord.forEach((operation) => {
      operationsRecord.push(this.getOperation(operation))
    })

    const traits: string[] = []

    o.traits.forEach((trait) => {
      traits.push(<li key={trait.name}>{trait.name}</li>)
    })

    return <div>
      <ul className='officerData'>
        <li>{o.fullName()}</li>
        <li>Senior: {o.isSenior() ? 'Yes' : 'No'}</li>
        <li>Passed: {o.isPassedForPromotion() ? 'Yes' : 'No'}</li>
        <li>Faction: {o.faction.type}</li>
        <li>Experience: {o.experience}</li>
        <li>Prestige: {o.prestige}</li>
        <li>Operations: {o.getTotalTraitValue('operations')}</li>
        <li>Communications: {o.getTotalTraitValue('communications')}</li>
        <li>Espionage: {o.getTotalTraitValue('intelligence')}</li>
        <li>Militancy: {o.militancy}</li>
        <li>Skill: {o.getTotalTraitsValue()}</li>
        <li>-</li>
        <li>{events}</li>
        <li>-</li>
      </ul>

      <ul className='officerTraits'>
        {traits}
      </ul>

      <div className='clear'></div>

      <div className='operationList'>{operationsRecord}</div>
    </div>
  }
}

export class UIOperation extends React.Component {
  props: {
    operation: Operation,
    officerOperationClicked: Subject<Operation>,
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

  componentWillMount () {
    this.props.officerOperationClicked.subscribe((operation: Operation) => {
      if (operation.name === this.props.operation.name) {
        super.setState({open: !this.state.open})
      } else {
        super.setState({open: false})
      }
    })
  }


  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.props.officerOperationClicked.next(this.props.operation)
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
        {/* <li>Because:    {operation.metadata.because}</li> */}
      </ul>
      : <div></div>

    return <div className='operationItem' onClick={this.inspect}>
      <div className='operationTitle'>{operation.started} {operation.name}</div>
      {content}
    </div>
  }
}
