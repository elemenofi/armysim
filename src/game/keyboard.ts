
import { Game } from './game'

export class Keyboard {
  game: Game

  constructor (game: Game) {
    this.game = game
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
