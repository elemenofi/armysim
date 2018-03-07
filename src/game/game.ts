import { Headquarter } from './entities/army'
import { FactionNames } from './entities/faction'
import { Keyboard } from './keyboard'
import { Logger } from './logger'
import { UI } from './ui/ui'

export interface Window {
  game: Game
  pause: () => void
  coup: () => void
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
    this.headquarter.tick(this.turn)
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

window.pause = () => {
  window.game.pause()
}

window.coup = () => {
  window.game.headquarter.staff.coup(FactionNames.left)
}
