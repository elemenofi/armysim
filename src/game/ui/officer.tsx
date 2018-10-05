import * as React from 'react'
import { Officer } from '../entities/officer'

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