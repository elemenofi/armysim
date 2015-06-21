/* jshint ignore:start */
import React from './react';

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
    let army = this.props.army;
    
    let corps = [];
        
    army.units.corps.forEach(corp => {
      corps.push(
        <div key={corp.id}>
          <Unit unit={corp}/>
        </div>
      );
    });

    return(
      <div>{corps}</div>
    ); 
  }
}

class Unit extends React.Component {
  render () {
    let unit = this.props.unit;

    let subunits = [];
    
    if (unit.subunits) {
      unit.subunits.forEach(subunit => {
        subunits.push(
          <div key={subunit.id}>  
            <Unit unit={subunit}/>
          </div>
        );
      });
    }

    return(
      <div>
        <p>{unit.commander.name()}</p>
        {subunits} 
      </div>
    );
  }
}

export default Ui;