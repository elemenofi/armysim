
export class Rank {
  tier: number
  max: number

  private readonly names = [
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

  private readonly maxes = [
    5 * 365,
    10 * 365,
    15 * 365,
    20 * 365,
    25 * 365,
    30 * 365,
    35 * 365,
    40 * 365,
    45 * 365,
  ]

  constructor (tier: number) {
    this.tier = tier
    this.max = this.getMax()
  }

  name (): string {
    return this.names[this.tier - 1]
  }

  private getMax (): number {
    return this.maxes[this.tier - 1]
  }
}
