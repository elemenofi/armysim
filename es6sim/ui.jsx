/* jshint ignore:start */
import React from './react';
import Comparison from './comparison';

let comparison = new Comparison();

class Ui {
  render (officers, units) {
    React.render(
      <Army officers={officers} units={units} />, 
      document.body
    );
  }
}

class Army extends React.Component {
  render () {
    let staff = this.props.officers.staff;
    
    staff.sort(comparison.byRank);

    let officers = [];

    staff.forEach(officer => {
      officers.push(
        <div>{officer.name()}</div>
      );
    });

    return(
      <div>
        <div>{ officers }</div>
      </div>
    ); 
  }
}

export default Ui;