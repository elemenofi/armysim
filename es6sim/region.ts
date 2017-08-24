import * as chance from './lib/chance'
import Unit from './unit'

interface Chance {
  last (): string
  first (o: object): string
  city (): string
}

class Region {
  id: number
  name: string
  units: Unit[]
  chance: Chance
  constructor (id) {
    this.id = id
    this.chance = chance(Math.random)
    this.name = this.chance.city()
    this.units = []
  }
}

export default Region
