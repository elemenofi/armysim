/* jshint ignore:start */
import React from './react';
import Comparison from './comparison';

let comparison = new Comparison();

class Ui {
  render (officers) {
    React.render(
      <Army officers={officers} />, 
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

    return <div>{ officers }</div>;
  }
}

export default Ui;