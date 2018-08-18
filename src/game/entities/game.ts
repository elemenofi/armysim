import { UI } from '../ui/ui'
import { Headquarter } from './army'
import { FactionNames } from './faction'
import { Keyboard } from './keyboard'
import { Logger } from './logger'

export interface Window {
  game: Game
  pause: () => void
  coup: (side: FactionNames) => void
}

declare const window: Window

export class Game {
  ui: UI
  headquarter: Headquarter
  keyboard: Keyboard
  turn = 0
  status = 'playing'

  constructor () {
    this.ui = new UI()
    this.keyboard = new Keyboard(this)
    this.headquarter = new Headquarter()
    this.tick()
    this.pause()
  }

  public pause () {
    if (this.status === 'playing') {
      this.status = 'paused'
    } else {
      this.status = 'playing'
      this.tick()
    }
  }

  public advance () {
    this.turn++
    this.headquarter.tick()
    this.ui.render(this)
  }

  private tick () {
    // if (this.turn === 0) {
    //   for (var i = 0; i < (5*365); i++) {
    //     this.advance()
    //   }
    // }

    if (this.status === 'paused') return

    this.advance()

    setTimeout(() => this.tick())
  }

}

window.game = new Game()
