import { UI } from '../ui/ui'
import { Headquarter } from './army'
import { FactionNames } from './faction'
import { Keyboard } from './keyboard'

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
    console.log('[debug] Game is starting')
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
    if (this.turn > (20 * 365)) this.ui.render(this)
  }

  private tick () {
    if (this.turn === 0) {
      console.log('[debug] Turn 0')
      // pass a thousand million turns until the general
      // has done all the steps, because everyone starts fresh
      // then assign the player as general
      for (let i = 0; i < (20 * 365); i++) {
        if (i === (20 * 365)) console.log('[debug] Last buffer turn')
        this.advance()
      }

      this.headquarter.staff.createPlayerOfficer()
      // this.headquarter.staff.assignChiefs()
    }

    if (this.status === 'paused') return

    this.advance()

    setTimeout(() => this.tick())
  }

}

window.game = new Game()
