
export class Rank {
  tier: number
  max: number

  names = [
    'Lieutenant',
    'Captain',
    'Major',
    'Lieutenant Coronel',
    'Coronel',
    'Brigade General',
    'Division General',
    'Lieutenant General',
    'General',
  ]

  maxes = [
    2 * 365,
    4 * 365,
    6 * 365,
    8 * 365,
    10 * 365,
    12 * 365,
    14 * 365,
    16 * 365,
    18 * 365,
  ]

  constructor (tier: number) {
    this.tier = tier
    this.max = this.getMax()
  }

  getMax (): number {
    return this.maxes[this.tier - 1]
  }

  name (): string {
    return this.names[this.tier - 1]
  }
}
