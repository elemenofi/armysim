

import * as React from 'react'
import { Officer } from '../entities/officer'
import { Headquarter } from '../entities/army';
import { Game } from '../entities/game';

export class UIActions extends React.Component {
    props: {
      game: Game,
      hq: Headquarter,
      officer: Officer,
    }
  
    constructor (props) {
      super(props)
    }

    getRelatedOfficer (which: 'superior' | 'competitor'): Officer {
      const officer = (which === 'superior') 
        ? this.props.officer.superior() 
        : this.props.officer.competitor()
      return officer
    }

    inspect (which: 'superior' | 'competitor', e) {
      e.preventDefault()
      this.props.hq.staff.inspect(this.getRelatedOfficer(which))
      this.props.game.advance()
    }

    plot (which: 'superior' | 'competitor', e) {
      e.preventDefault()
      this.props.hq.player.plot(this.getRelatedOfficer(which))
    }
  
    render () {
      const o = this.props.officer
  
      if (!o || !this.props.officer.isPlayer) return <div></div>
  
      const actions = <ul>
        <li onClick={(e) => this.inspect('superior', e)}>
        {o.superior() ? 'Superior: ' + o.superior().fullName() : ''}
        <button onClick={(e) => this.plot('superior', e)}>Plot</button>
        </li>
        <li onClick={(e) => this.inspect('competitor', e)}>
        {o.competitor() ? 'Competitor: ' + o.competitor().fullName() : ''}
        <button onClick={(e) => this.plot('competitor', e)}>Plot</button>
        </li>
      </ul>
  
      return <div>
        {actions}
      </div>
    }
}