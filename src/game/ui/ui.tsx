import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Headquarter } from '../entities/army'
import { Game } from '../entities/game'
import { Officer } from '../entities/officer'
import { Unit } from '../entities/unit'
import { constants } from '../entities/util'
import Button from '@material-ui/core/Button'


export class UI {
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
    super(props)
  }

  render () {
    const game = this.props.game
    const hq = game.headquarter
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + hq.turn)

    return <div className='army'>
      <h1>
        { tomorrow.toISOString().slice(0, 10) }
      </h1>
      <div className='officer'>
        <UIOfficer officer={hq.player}/>
      </div>
      <div className='officer procer'>
        <div className='clear'></div>
        <UIOfficer officer={hq.staff.inspected}/>
      </div>
      <div className='clear'></div>
      <div className='units'>
        <UIUnit hq={hq} unit={hq.army} game={game}/>
      </div>
    </div>
  }
}

export class UIUnit extends React.Component {
  props: {
    unit: Unit
    hq: Headquarter,
    game: Game,
  }

  constructor (props) {
    super(props)
    this.inspect = this.inspect.bind(this)
  }

  label (tier: number): {label: string, size: string} {
    return constants.label(tier)
  }

  inspect (e) {
    e.preventDefault()
    e.stopPropagation()
    this.props.hq.staff.inspect(this.props.unit.officer)
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

    const selected = (
      this.props.hq.staff.inspected &&
      (this.props.unit.officer.id === this.props.hq.staff.inspected.id)
    ) ? 'selected' : ''

    return <div onClick={this.inspect} className={selected}>
      {this.label(u.tier).label}
      {subunits}
    </div>
  }
}

export class UIOfficer extends React.Component {
  props: {
    officer: Officer,
  }

  constructor (props) {
    super(props)
  }

  render () {
    const o = this.props.officer

    if (!o) return <div></div>

    // if (o.isPlayer) return <div>{o.fullName()}</div>

    const events: JSX.Element[] = []

    o.events.forEach((event) => {
      events.push(<div key={event}>{event}</div>)
    })

    const traits: JSX.Element[] = []

    o.traits.forEach((trait) => {
      traits.push(<li key={trait.name}>{trait.name}</li>)
    })

    return <div>
      <ul className='officerData'>
        <li>{o.fullName()}</li>
        <li>Senior: {o.isSenior() ? 'Yes' : 'No'}</li>
        <li>Passed: {o.isPassedForPromotion() ? 'Yes' : 'No'}</li>
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
    </div>
  }
}
