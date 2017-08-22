import * as moment from 'moment'
import Army from './army'
import HQ from './HQ'
import config from './config'

class Journal {
  HQ: HQ;

  constructor (HQ: HQ) {
    this.HQ = HQ
  }

  formatDate (): string {
    return moment(this.HQ.rawDate).format('YYYY, Do of MMMM ');
  }

  promoted (rank: string, unitId: number): string {
    return `${this.formatDate()} promoted to ${config.ranks[rank].title}, ${this.HQ.findUnitById(unitId).name}`
  }

  graduated (unitName: string) {
    return `${this.formatDate()} graduated and assigned to ${unitName}`
  }

  // school () {
  //   return `Finished High School at St. ${school.name}'s  in ${school.date}`;
  // }
}

export default Journal