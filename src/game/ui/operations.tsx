

import * as React from 'react'
import { Officer } from '../entities/officer'
import { Headquarter } from '../entities/army';
import { Game } from '../entities/game';
import { OperationTypes, Operation } from '../entities/operations';

export class UIOperations extends React.Component {
  props: {
    game: Game,
    hq: Headquarter,
    officer: Officer,
  }

  constructor(props) {
    super(props)
  }

  select(operationType: OperationTypes, e) {
    e.preventDefault()
    this.props.game.advance()
  }

  render() {
    const o = this.props.officer

    if (!o || !this.props.officer.isPlayer) return <div></div>

    const current = <div className='operationsCurrent'>{o.operations}</div>

    let currentOperations = []
    let currentOperationList = <ul>
      {currentOperations}
    </ul>
    o.operations.current.forEach((o: Operation) => {
      currentOperations.push(<li>{o.type} operations against {o.target.fullName()}, {o.progress}, {o.status}</li>)
    })

    const actions = <ul className='actions operations'>
      {current}
      <li><button onClick={(e) => this.select(OperationTypes.combat, e)}>Combat</button></li>
      <li><button onClick={(e) => this.select(OperationTypes.intelligence, e)}>Intelligence</button></li>
    </ul>

    return <div>
      <hr className='divider'></hr>
      {actions}
      {currentOperationList}
    </div>
  }
}