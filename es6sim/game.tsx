
// import Army from './army'
// import Engine from './engine'
// import Keyboard from './keyboard'

import { Game } from './v2/army'

interface Window { game: Game }

declare var window: Window

window.game = new Game()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

export interface GameProps { game: Game; }

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class Main extends React.Component<GameProps, {}> {
  props
  render () {
    return <h1>{this.props.game.turn}</h1>
  }
}

ReactDOM.render(
  <Main game={window.game} />,
  document.getElementById('game')
);

// window.army = new Army()
// window.army.engine = new Engine(window.army)
// window.army.keyboard = new Keyboard(window.army.engine)
