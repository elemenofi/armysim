import * as React from 'react'
import { Officer } from '../entities/officer'
import { Headquarter } from '../entities/army';
import { Game } from '../entities/game';

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

    inspect (which: 'superior' | 'competitor') {
      const officer = (which === 'superior') ? this.props.officer.superior() : this.props.officer.competitor()
      this.props.hq.staff.inspect(officer)
      this.props.game.advance()
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
          <li>Prestige: {o.prestige}</li>
          <li>Operations: {o.getTotalTraitValue('operations')}</li>
          <li>Communications: {o.getTotalTraitValue('communications')}</li>
          <li>Espionage: {o.getTotalTraitValue('intelligence')}</li>
          <li>Militancy: {o.militancy}</li>
          <li>Skill: {o.getTotalTraitsValue()}</li>
          <li>-</li>
          <li>{events}</li>
          <li>-</li>
          <li onClick={() => this.inspect('superior')}>{o.superior() ? 'Superior: ' + o.superior().fullName() : ''}</li>
          <li onClick={() => this.inspect('competitor')}>{o.competitor() ? 'Competitor: ' + o.competitor().fullName() : ''}</li>
        </ul>
  
        <ul className='officerTraits'>
          {traits}
        </ul>
  
        <div className='clear'></div>
      </div>
    }
}