import { util } from '../util'

export enum FactionNames {
  left = 'Left',
  right = 'Right',
  center = 'Center',
}

export const randomFaction = () => {
  const random = util.random(10)
  if (random === 0) return FactionNames.left
  else if (random === 1) return FactionNames.right
  else return FactionNames.center
}

export class Faction {
  type: FactionNames

  constructor () {
    this.type = randomFaction()
  }
}
