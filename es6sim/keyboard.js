//keybindings
class Keyboard {
  constructor (engine) {
    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 32 && event.target === document.body) {
        event.preventDefault()
        engine.pause()
      }
    })
  }
}

export default Keyboard
