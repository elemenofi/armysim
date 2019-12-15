import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Game } from '../entities/game'
import { UIUnit } from './unit';
import { UIOfficer } from './officer'

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
    tomorrow.setDate(-100 * 365)
    tomorrow.setDate(tomorrow.getDate() + hq.turn)

    return <div className='army'>
      <h1>
        { tomorrow.toISOString().slice(0, 10) }
      </h1>
      <div className='officer'>
        <UIOfficer game={game} hq={hq} officer={hq.player} />
      </div>
      <div className='officer procer'>
        <div className='clear'></div>
        <UIOfficer game={game} hq={hq} officer={hq.staff.inspected} />
      </div>
      <div className='clear'></div>
      <div className='units'>
        <UIUnit game={game} hq={hq} unit={hq.army} />
      </div>
    </div>
  }
}