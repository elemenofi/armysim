
import Actions from './actions'
import Army from './army'
import config from './config'
import VUi from './ui-game.jsx'

class Engine {
  army: Army
  running: boolean
  ui: VUi
  actions: Actions
  turn: number
  gameLoop
  uiLoop

  constructor (army) {
    this.army = army
    this.ui = new VUi(this)
    this.actions = new Actions(this)
    this.turn = 0
    this.running = true
    this.start()
  }

  getTurns () {
    return this.turn
  }

  start () {
    this.update()
    this.army.hq.makePlayer()
    this.updateUI()
    this.pause()
  }

  pause () {
    this.running = !this.running
    if (this.running) this.update()
    if (this.running) this.updateUI()
  }

  update (triggeredByUserAction?) {
    while (this.turn < config.bufferTurns) {
      this.army.hq.update()
      this.turn++
    }

    this.army.hq.update(triggeredByUserAction)
    this.turn++

    if (this.running) {
      this.gameLoop = setTimeout(() => {
        this.update()
      }, config.speed)
    }
  }

  updateUI () {
    this.ui.render(this.army)
    if (this.running) {
      this.uiLoop = setTimeout(() => {
        this.updateUI()
      }, config.speed)
    }
  }
}

export default Engine
