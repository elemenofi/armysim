

import * as React from 'react'
import { Officer } from '../entities/officer'
import { Headquarter } from '../entities/army';
import { Game } from '../entities/game';
import { OperationTypes } from '../entities/officerOperations';

export class UIOperations extends React.Component {
  props: {
    game: Game,
    hq: Headquarter,
    officer: Officer,
  }

  constructor(props) {
    super(props)
  }

  select(which: OperationTypes, e) {
    e.preventDefault()
    this.props.hq.player.operations.planning = which
    this.props.game.advance()
  }

  render() {
    const o = this.props.officer

    if (!o || !this.props.officer.isPlayer) return <div></div>

    const current = <div className='operationsCurrent'>{o.operations.planning}</div>

    const actions = <ul className='actions operations'>
      {current}
      <li><button onClick={(e) => this.select(OperationTypes.combat, e)}>Combat</button></li>
      <li><button onClick={(e) => this.select(OperationTypes.intelligence, e)}>Intelligence</button></li>
    </ul>

    return <div>
      <hr className='divider'></hr>
      {actions}
    </div>
  }
}