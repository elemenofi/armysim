/* jshint ignore:start */
import React from './lib/react';
import Comparisons from './comparisons';

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
      player: this.props.officer,
      engine: this.props.engine,
      name: undefined,
      type: undefined,
      officer: undefined,
      target: undefined
    }
  }

  startOperation (spec) {
    if (!this.state.type || !this.state.officer || !this.state.target) {
      alert('Complete operation details first.');
      return;
    }
    var army = this.state.engine.army;
    var staffOfficerId = this.state.officer.split(',')[0];
    var playerUnitId = this.state.officer.split(',')[1];
    var targetId = this.state.target;
    var spec = {
      name: this.state.name,
      type: this.state.type,
      officer: army.HQ.findStaffById(staffOfficerId, playerUnitId),
      target: army.HQ.findOfficerById(targetId)
    };
    army.HQ.operations.add(spec);
  }

  handleName (event) {
    this.setState({name: event.target.value});
  }

  handleType (event) {
    this.setState({type: event.target.value});
  }

  handleOfficer (event) {
    this.setState({officer: event.target.value});
  }

  handleTarget (event) {
    this.setState({target: event.target.value});
  }

  render () {
    let army = this.state.engine.army;
    let player = this.state.player;

    let types = ['commanding', 'intelligence'];
    let targets = army.HQ.findActiveOfficers();
    let staff = army.HQ.findStaff(this.props.officer);

    let operationTypes = [];
    let officers = [];
    let staffOfficers = [];

    types.forEach(type => {
      operationTypes.push(<option>{ type }</option>);
    });

    targets.forEach(target => {
      officers.push( <option value={ target.id }>{ target.name() }</option> );
    });

    staff.forEach(officer => {
      staffOfficers.push( <option value={ [officer.id, player.unitId] }>{ officer.name() }</option> );
    });

    operationTypes.unshift(<option></option>);
    officers.unshift(<option></option>);
    staffOfficers.unshift(<option></option>);

    return(
      <div>
        <div>New Operation</div>
        <div>Type</div>
        <input onChange={ this.handleName.bind(this) }/>
        <select onChange={ this.handleType.bind(this) }>
          { operationTypes }
        </select>
        <div>Commander</div>
        <select onChange={ this.handleOfficer.bind(this) }>
          { staffOfficers }
        </select>
        <div>Target</div>
        <select onChange={ this.handleTarget.bind(this) }>
          { officers }
        </select>
        <br></br>
        <button onClick={ this.startOperation.bind(this) }>
          Start Operation
        </button>
      </div>
    );
  }
}

export default Ui;
