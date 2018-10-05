import * as React from 'react'
import { Officer } from '../entities/officer'
import { Headquarter } from '../entities/army';
import { Game } from '../entities/game';
import { UIActions } from './actions';

export class UIOfficer extends React.Component {
    props: {
      officer: Officer,
      hq: Headquarter,
      game: Game
    }
  
    constructor (props) {
      super(props)
      this.inspect = this.inspect.bind(this)
    }

    getRelatedOfficer (which: 'superior' | 'competitor'): Officer {
      const officer = (which === 'superior') 
        ? this.props.officer.superior() 
        : this.props.officer.competitor()
      return officer
    }

    inspect (which: 'superior' | 'competitor') {
      this.props.hq.staff.inspect(this.getRelatedOfficer(which))
      this.props.game.advance()
    }

    plot (which: 'superior' | 'competitor') {
      this.props.hq.player.plot(this.getRelatedOfficer(which))
    }
  
    render () {
      const o = this.props.officer
  
      if (!o) return <div></div>
  
      // if (o.isPlayer) return <div>{o.fullName()}</div>
  
      const events: Element[] = []
  
      o.events.forEach((event) => {
        events.push(<div key={event}>{event}</div>)
      })
  
      const traits: Element[] = []
  
      o.traits.forEach((trait) => {
        traits.push(<li key={trait.name}>{trait.name}</li>)
      })
  
      return <div>
        <ul className='officerData'>
          <li>{o.fullName()}</li>
          <li>Senior: {o.isSenior() ? 'Yes' : 'No'}</li>
          <li>Passed: {o.isPassedForPromotion() ? 'Yes' : 'No'}</li>
          <li>Experience: {o.experience}</li>
          <li>Operations: {o.getTotalTraitValue('operations')}</li>
          <li>Combat: {o.getTotalTraitValue('combat')}</li>
          <li>Intelligence: {o.getTotalTraitValue('intelligence')}</li>
          <li>Skill: {o.getTotalTraitsValue()}</li>
          <li>Militancy: {o.militancy}</li>
          <li>-</li>
          <li>{events}</li>
          <li>-</li>
          <li><UIActions game={this.props.game} hq={this.props.hq} officer={o} /></li>
        </ul>
  
        <ul className='officerTraits'>
          {traits}
        </ul>
  
        <div className='clear'></div>
      </div>
    }
}