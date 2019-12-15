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
    this.inspections = 0
    this.intelligence = 0
    this.signals = 0
    this.logistics = 0
    this.finance = 0
    this.operations = 0
    this.personnel = 0
    this.arsenals = 0
    this.doctrine = 0
  }

  getInitialSkills () {
    return this;
  }
}
