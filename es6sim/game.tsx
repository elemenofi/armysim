
// import Army from './army'
// import Engine from './engine'
// import Keyboard from './keyboard'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Game } from './v2/army'

export interface Window { game: Game }
export interface MainProps { game: Game; }

export class Main extends React.Component<MainProps, {}> {
  props
  render () {
    return <h1>{this.props.game.turn}</h1>
  }
}

export class UI extends React.Component {
  render (game: Game) {
    ReactDOM.render(
      <Main game={game} />,
      document.getElementById('game')
    )
  }
}


declare var window: Window

window.game = new Game()




// window.army = new Army()
// window.army.engine = new Engine(window.army)
// window.army.keyboard = new Keyboard(window.army.engine)
