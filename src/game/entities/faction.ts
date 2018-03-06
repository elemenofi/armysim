import { util } from '../util'

export enum FactioNames {
  left = 'Left',
  right = 'Right',
  center = 'Center',
}

export const randomFaction = () => {
  const random = util.random(10)
  if (random === 3) return FactioNames.left
  else if (random === 4) return FactioNames.right
  else return FactioNames.center
}

export class Faction {
  type: FactioNames

  constructor (type: FactioNames) {
    this.type = type
  }
}
