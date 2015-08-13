/* jshint ignore:start */
import React from './lib/react';
import Comparisons from './comparisons';

let comparisons = new Comparisons();

class Ui {
  constructor (spec) {
    this.engine = spec;
  }

  render (army) {
    React.render(
      <Army engine={ this.engine } />,
      document.body
    );
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

    return (
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
    return (
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
    return (
      <div>
        <div>{ this.state.player.name() }</div>
        <Office officer={this.state.player} engine={ this.state.engine } />
      </div>
    );
  }
}

class Office extends React.Component {
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
    army.HQ.findStaff(this.state.officer).forEach(staffOfficer => {
      staff.push(<li>{ staffOfficer.name() }</li>);
    });
    var subordinates = [];
    army.HQ.findSubordinates(this.state.officer).forEach(subordinate => {
      subordinates.push(<li>{ subordinate.name() }</li>);
    });
    return (
      <div>
        <div>{ unit.name }</div>
        <div>SUPERIOR OFFICER</div>
        <div>{ superior.name() }</div>
        <div>STAFF OFFICERS</div>
        <ul className="staffOfficers">{ staff }</ul>
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
      officer: this.props.officer
    }
  }
  render () {
    return (
      <div>
        <div>{ this.state.officer.name() }</div>
      </div>
    );
  }
}



export default Ui;
