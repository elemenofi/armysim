

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

  constructor(props) {
    super(props)
  }

  getRelatedOfficer(which: 'superior' | 'competitor'): Officer {
    const officer = (which === 'superior')
      ? this.props.officer.superior()
      : this.props.officer.competitor()
    return officer
  }

  inspect(target: 'superior' | 'competitor', e) {
    e.preventDefault()
    this.props.hq.staff.inspect(this.getRelatedOfficer(target))
    this.props.game.advance()
  }

  plot(target: 'superior' | 'competitor', e) {
    e.preventDefault()
    this.props.hq.player.operations.start(this.getRelatedOfficer(target))
  }

  render() {
    const o = this.props.officer

    if (!o || !this.props.officer.isPlayer) return <div></div>

    const actions = <ul className='actions'>
      <li onClick={(e) => this.inspect('superior', e)}>
        {o.superior() ? 'Superior: ' + o.superior().fullName() : ''}
      </li>
      <li><button onClick={(e) => this.plot('superior', e)}>Plot</button></li>
      <li onClick={(e) => this.inspect('competitor', e)}>
        {o.competitor() ? 'Competitor: ' + o.competitor().fullName() : ''}
      </li>
      <li><button onClick={(e) => this.plot('competitor', e)}>Plot</button></li>
    </ul>

    return <div>
      {actions}
    </div>
  }
}