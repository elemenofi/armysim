
import config from './config'
import Officer from './officer'

class Player extends Officer {
  constructor(spec, hq, unitName) {
    spec.isPlayer = true
    super(spec, hq, unitName)
  }
}

export default Player
