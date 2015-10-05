/* jshint ignore:start */
import React from './lib/react';
import Comparisons from './comparisons';
import Select from '../node_modules/react-select';

let comparisons = new Comparisons();

class Ui {
  constructor (spec) {
    this.engine = spec;
  }

  render (army) {
    React.render(<Army engine={ this.engine } />, document.body);
  }
}

class Army extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      army: props.engine.army,
      engine: props.engine
    }
  }

  render () {
    var army = this.state.army;
    var engine = this.state.engine;
    return(
      <div>
        <Date hq={ army.HQ } engine={ engine } />
        <Player player={ army.HQ.player } engine={ engine }/>
      </div>
    );
  }
}

class Date extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      hq: this.props.hq,
      engine: this.props.engine
    };
  }

  pause () {
    this.state.engine.pause();
  }

  render () {
    return(
      <div onClick={ this.pause.bind(this) }>{ this.state.hq.realDate }</div>
    );
  }
}

class Player extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      player: this.props.player,
      engine: this.props.engine
    };
  }

  render () {
    return(
      <div>
        <div>{ this.state.player.name() }</div>
        <Staff officer={ this.state.player } engine={ this.state.engine } />
        <br></br>
        <Unit officer={ this.state.player }  engine={ this.state.engine } />
      </div>
    );
  }
}

class Staff extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      officer: this.props.officer,
      engine: this.props.engine
    };
  }

  render () {
    var army = this.state.engine.army;
    var unit = army.HQ.findUnitById(this.state.officer.unitId);
    var superior = army.HQ.findCommandingOfficer(this.state.officer);
    var staff = [];
    var subordinates = [];

    army.HQ.findStaff(this.state.officer).forEach(staffOfficer => {
      staff.push(<li><Officer officer={ staffOfficer } engine={ this.state.engine }/></li>);
    });

    army.HQ.findSubordinates(this.state.officer).forEach(subordinate => {
      subordinates.push(<li><Officer officer={ subordinate } engine={ this.state.engine }/></li>);
    });

    return(
      <div>
        <div>{ unit.name }</div>
        <br></br>
        <div>SUPERIOR OFFICER</div>
        <div>{ superior.name() }</div>
        <br></br>
        <div>STAFF OFFICERS</div>
        <ul className="staffOfficers">{ staff }</ul>
        <br></br>
        <div>SUBORDINATE OFFICERS</div>
        <ul className="staffOfficers">{ subordinates }</ul>
      </div>
    );
  }
}

class Officer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      engine: this.props.engine
    }
  }

  render () {
    return(
      <div>
        <div>{ this.props.officer.name() }</div>
      </div>
    );
  }
}

class Unit extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      player: this.props.player,
      engine: this.props.engine
    }
  }

  giveOrder () {
    var army = this.state.engine.army;
    var spec = {};
    spec.commander = this.props.player;
    army.HQ.operations.push(army.HQ.operations.add());
  }

  render () {
    let targets = this.state.engine.army.HQ.findActiveOfficers();
    let options = []
    targets.forEach(target => {
      options.push(<option>{ target.name() }</option>);
    });

    return(
      <div>
        <div>OPERATIONS</div>
        <select>{ options }</select>
        <button onClick={ this.giveOrder.bind(this) }>Plan Operation</button>
      </div>
    );
  }
}

export default Ui;
