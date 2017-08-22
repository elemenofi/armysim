import * as moment from 'moment'
import Army from './army'

class Journal {
  formatDate (rawDate: moment.Moment): string {
    return moment(rawDate).format('YYYY, D of MMMM ');
  }

  promoted (promotion) {
    return 'Promoted'
  }

  graduated (graduation) {
    return 'Graduated from ' + graduation
  }

  // school () {
  //   return `Finished High School at St. ${school.name}'s  in ${school.date}`;
  // }
}

export default new Journal()