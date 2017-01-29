//keybindings
class Keyboard {
  constructor (engine) {
    window.addEventListener('keydown', function(e) {
      if(e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
        engine.pause()
      }
    });
  }
}

export default Keyboard
