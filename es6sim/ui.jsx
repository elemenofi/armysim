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
    let army = this.props.army;

    return(
      <div>
        <Corps corps={army.units.corps}/>
      </div>
    ); 
  }
}

class Corps extends React.Component {
  render () {
    let elements = [];
    let corps = this.props.corps;
    
    corps.forEach(corp => {
      elements.push(
        <div>
          <p>{corp.commander.rank.title} {corp.commander.name()}</p>
          <Divisions divisions={corp.divisions} /> 
        </div>
      );
    });

    return(<div>{elements}</div>);
  }
}

class Divisions extends React.Component {
  render () {
    let elements = [];
    let divisions = this.props.divisions;
    
    divisions.forEach(division => {
      elements.push(
        <div>
          <p>{division.commander.rank.title}  {division.commander.name()}</p>
          <Brigades brigades={division.brigades} />
        </div>
      );
    });

    return(<div>{elements}</div>)
  }
}

class Brigades extends React.Component {
  render () {
    let elements = [];
    let brigades = this.props.brigades;
    
    brigades.forEach(brigade => {
      elements.push(
        <div>
          <p>{brigade.commander.rank.title}  {brigade.commander.name()}</p>
          <Regiements regiments={brigade.regiments} />
        </div>
      );
    });

    return(<div>{elements}</div>)
  }
}

export default Ui;