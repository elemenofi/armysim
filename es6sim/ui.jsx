/* jshint ignore:start */
import React from './react';

class Ui {
  constructor (spec) {
    this.engine = spec;
  }

  render (army) {
    React.render(
      <Army officers={army.HQ.officers} army={army} engine={this.engine}/>, 
      document.body
    );
  }
}

class Army extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      officers: props.officers, 
      army: props.army, engine: props.engine
    };
  }

  pause () {
    this.state.engine.pause();
  }

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
      <div>
        <div onClick={this.pause.bind(this)}>Pause</div>
        <div>{corps}</div>
      </div>
    ); 
  }
}

class Commander extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hover: false};
  }

  mouseOver () {
    this.setState({hover: true});
  }

  mouseOut () {
    this.setState({hover: false});
  }

  render () {
    let history = [];
  
    if (this.state.hover && this.props.officer.history) {
      this.props.officer.history.forEach(log => {
        history.push(<p>{log}</p>);
      });
    }
  
    return (
      <div onMouseOver={this.mouseOver.bind(this)} 
        onMouseOut={this.mouseOut.bind(this)}>
        <p>{this.props.officer.name()} {this.props.officer.alignment}</p>
        <div className="history">{history}</div>
      </div>
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
      <div className={unit.type}>
        <Commander officer={unit.commander}/>
        {subunits}
      </div>
    );
  }
}

export default Ui;