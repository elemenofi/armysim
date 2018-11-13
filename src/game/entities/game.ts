import { UI } from '../ui/ui'
import { Headquarter } from './army'
import { Keyboard } from './keyboard'

export interface Window {
  game: Game
  pause: () => void
}

declare const window: Window

export class Game {
  ui: UI
  headquarter: Headquarter
  keyboard: Keyboard
  status = 'playing'
  BUFFER: number = 100 * 365

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
    this.headquarter.tick()
    if (this.headquarter.turn > this.BUFFER) this.ui.render(this)
  }

  private async tick () {
    if (this.headquarter.turn === 0) {
      this.turnZero()
    }

    if (this.status === 'paused') return

    this.advance()

    setTimeout(() => this.tick())
  }

  private turnZero () {
    console.log('[debug] Turn 0')
      
    for (let i = 0; i < this.BUFFER; i++) {
      if (i === (20 * 365)) console.log('[debug] Last buffer turn')
      this.advance()
    }

    this.headquarter.staff.createPlayerOfficer()
  }
}

window.game = new Game()
