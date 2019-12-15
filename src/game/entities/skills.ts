export class Skills {
  personnel: number
  operations: number
  inspections: number
  intelligence: number
  logistics: number
  signals: number
  arsenals: number
  doctrine: number
  finance: number

  constructor () {
    this.inspections = 100
    this.intelligence = 100
    this.signals = 100
    this.logistics = 100
    this.finance = 100
    this.operations = 100
    this.personnel = 100
    this.arsenals = 100
    this.doctrine = 100
  }

  getInitialSkills () {
    return this;
  }
}
