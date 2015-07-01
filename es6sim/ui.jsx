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
    let player = army.HQ.player;
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
        <Player player={player}/>
        <div onClick={this.pause.bind(this)}>Pause</div>
        <div>{corps}</div>
      </div>
    );
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let player = this.props.player;
    let operations = [];
    player.operations.forEach(operation => {
      operations.push(
        <ul>
          <li>Target: {operation.target.name()}</li>
          <li>Strength: {operation.strength}</li>
          <li>Type: {operation.type}</li>
        </ul>
      );
    });
    return (
      <div>
        <p>{player.name()}</p>
        <ul>
          <li>Drift {player.drift}</li>
          <li>Alignment {player.alignment}</li>
          <li>Militancy {player.militancy}</li>
        </ul>
        <ul>
          <li>Diplomacy {player.diplomacy}</li>
          <li>Commanding {player.commanding}</li>
          <li>Intelligence {player.intelligence}</li>
          <li>Administration {player.administration}</li>
        </ul>
        <ul>
          <p>Operations</p>
          {operations}
        </ul>
      </div>
    );
  }
}

class Commander extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hover: false};
  }

  mouseClick () {
    this.setState({hover: !this.state.hover});
  }

  render () {
    let history = [];
    let title = (this.props.officer.isPlayer) ?
      <div><strong>{this.props.officer.name()}</strong></div> :
      <div>{this.props.officer.name()}</div>;

    if (this.state.hover && this.props.officer.history) {
      this.props.officer.history.forEach(log => {
        history.push(<p>{log}</p>);
      });
    }

    return (
      <div onClick={this.mouseClick.bind(this)}>
        {title}
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
