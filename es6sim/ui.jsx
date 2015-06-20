/* jshint ignore:start */
import React from './react';
import Comparison from './comparison';

let comparison = new Comparison();

class Ui {
  render (officers, army) {
    React.render(
      <Army officers={officers} army={army} />, 
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

    let army = this.props.army;

    let corps = [];

    army.units.corps.forEach(corp => {
      corps.push(
        <div>{corp.name}, {corp.commander.name()}, {corp.commander.experience}</div>
      );
    });

    return(
      <div>
        <div>{ officers }</div>
        <div>{ corps }</div>
      </div>
    ); 
  }
}

export default Ui;