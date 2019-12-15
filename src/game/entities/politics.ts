export class Politics {
  militancy: number
  loyalty: number
  alignment: number
  prestige: number

  constructor () {
    this.militancy = 0
    this.loyalty = 100
    this.alignment = 50
    this.prestige = 0
  }

  getInitialPolitics () {
    return this;
  }
}
