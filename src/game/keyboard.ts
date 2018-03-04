
import { Game } from './game'

export class Keyboard {
  constructor (private game: Game) {
    this.bindHotkeys()
  }

  bindHotkeys () {
    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 32 && event.target === document.body) {
        event.preventDefault()
        this.game.pause()
      }
    })
  }
}
