import * as moment from 'moment'
import Army from './army'
import hq from './hq'
import config from './config'
import { Operation } from './operation';
import { Officer } from './officer';

class Journal {
  hq: hq;

  constructor (hq: hq) {
    this.hq = hq
  }

  formatDate (): string {
    return moment(this.hq.rawDate).format('YYYY, Do of MMMM ');
  }

  operated (operation: Operation): string {
    return `
      ${this.formatDate()} completed ${operation.name} 
      ${operation.description} the ${this.hq.findUnitById(operation.target.unitId).name} 
      and forcing ${operation.target.name()} into retirement
    `
  }

  promoted (rank: string, unitId: number): string {
    return `${this.formatDate()} promoted to ${this.hq.secretary.ranks[rank].title}, ${this.hq.findUnitById(unitId).name}`
  }

  graduated (officer: Officer, unitName: string): string {
    return `${this.formatDate()} graduated from the ${officer.school.name} and assigned to ${unitName}`
  }

  // school () {
  //   return `Finished High School at St. ${school.name}'s  in ${school.date}`;
  // }
}

export default Journal
