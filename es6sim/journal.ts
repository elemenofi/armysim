import * as moment from 'moment'
import Army from './army'
import config from './config'
import hq from './hq'
import { Officer } from './officer'
import { Operation } from './operation'

class Journal {
  hq: hq

  constructor (HQ: hq) {
    this.hq = HQ
  }

  formatDate (): string {
    return moment(this.hq.rawDate).format('YYYY, MMMM Do')
  }

  operated (operation: Operation): string {
    return `
      ${this.formatDate()} completed ${operation.name}
      ${operation.description} the ${this.hq.units[operation.target.unitId].name}
      and forcing ${operation.target.name()} into retirement
    `
  }

  promoted (rank: string, unitId: number): string {
    return `${this.formatDate()} promoted to ${this.hq.secretary.ranks[rank].title}, ${this.hq.units[unitId].name}`
  }

  graduated (officer: Officer, unitName: string): string {
    return `${this.formatDate()} graduated from the ${officer.school.name} and assigned to ${unitName}`
  }

  action (action: string, officer: Officer) {
    return `${this.formatDate()} ${action} ${officer.name()}`
  }
}

export default Journal
