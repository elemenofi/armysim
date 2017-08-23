import * as moment from 'moment'
import Army from './army'
import HQ from './HQ'
import config from './config'
import { Operation } from './operation';

class Journal {
  HQ: HQ;

  constructor (HQ: HQ) {
    this.HQ = HQ
  }

  formatDate (): string {
    return moment(this.HQ.rawDate).format('YYYY, Do of MMMM ');
  }

  operated (operation: Operation): string {
    return `
      ${this.formatDate()} completed ${operation.name} 
      ${operation.description} the ${this.HQ.findUnitById(operation.target.unitId).name} 
      and forcing ${operation.target.name()} into retirement
    `
  }

  promoted (rank: string, unitId: number): string {
    return `${this.formatDate()} promoted to ${config.ranks[rank].title}, ${this.HQ.findUnitById(unitId).name}`
  }

  graduated (unitName: string): string {
    return `${this.formatDate()} graduated and assigned to ${unitName}`
  }

  // school () {
  //   return `Finished High School at St. ${school.name}'s  in ${school.date}`;
  // }
}

export default Journal