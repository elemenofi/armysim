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
      army: props.army,
      engine: props.engine
    };
  }

  pause () {
    this.state.engine.pause();
  }

  show () {
    this.setState({showArmy: !this.state.showArmy});
  }

  render () {
    let army = this.props.army;
    let player = army.HQ.player;
    let corps = [];

    if (this.state.showArmy) {
      army.units.corps.forEach(corp => {
        corps.push(
          <div key={corp.id}>
            <Unit unit={corp}/>
          </div>
        );
      });
    }

    return(
      <div>
        {this.state.army.HQ.realDate}
        <Player player={player}/>
        <button onClick={this.pause.bind(this)}>Pause</button>
        <button onClick={this.show.bind(this)}>Army</button>
        <div>
          {corps}
        </div>
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
      let result;

      if (operation.failed) {
        result = "Failed";
      } else {
        result = operation.result;
      }

      operations.push(
        <ul>
          <li>Target: {operation.target.name()}</li>
          <li>Strength: {operation.strength}</li>
          <li>Type: {operation.type.area}</li>
          <li>Result: {result}</li>
        </ul>
      );
    });

    let history = [];
    player.history.forEach(story => {
      history.push(<li>{story}</li>);
    });

    return (
      <div>
        <p>{player.name()}</p>
        <ul>
          <li>Diplomacy {player.diplomacy}</li>
          <li>Commanding {player.commanding}</li>
          <li>Intelligence {player.intelligence}</li>
          <li>Administration {player.administration}</li>
        </ul>
        <div>
          <p>Operations</p>
          {operations}
        </div>
        <ul>
          <p>History</p>
          {history}
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
  constructor() {
    super();
    this.state = {
      showCommander: false
    }
  }

  showCommander () {
    this.setState({showCommander: !this.state.showCommander})
  }

  render () {
    let unit = this.props.unit;
    let commander;
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

    if (this.state.showCommander) {
      commander = <Commander officer={unit.commander}/>;
    }

    return(
      <div className={unit.type}>
        <p onClick={this.showCommander.bind(this)}>{unit.name}</p>
        {commander}
        {subunits}
      </div>
    );
  }
}

export default Ui;
