
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
    5 * 365,
    10 * 365,
    15 * 365,
    18 * 365,
    21 * 365,
    23 * 365,
    25 * 365,
    28 * 365,
    30 * 365,
  ]

  constructor (tier: number) {
    this.tier = tier
    // this.max = this.getMax()
    this.max = tier * 100 * 3
  }

  getMax (): number {
    return this.maxes[this.tier - 1]
  }

  name (): string {
    return this.names[this.tier - 1]
  }
}
