
// import Army from './army'
// import Engine from './engine'
// import Keyboard from './keyboard'

import { Game } from './v2/army'

interface Window { game: Game }

declare var window: Window

window.game = new Game()

// window.army = new Army()
// window.army.engine = new Engine(window.army)
// window.army.keyboard = new Keyboard(window.army.engine)
