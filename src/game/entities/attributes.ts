export class Attributes {
  martial: number
  diplomacy: number
  research: number
  learning: number
  experience: number

  constructor () {
    this.martial = 100
    this.diplomacy = 100
    this.research = 100
    this.learning = 100
    this.experience = 100
  }

  getInitialAttributes () {
    return this;
  }
}
