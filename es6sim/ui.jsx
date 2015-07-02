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
    let inspected = () => {
      if (army.HQ.officers.inspected.fname !== undefined) {
        return (<Officer officer={army.HQ.officers.inspected}/>);
      }
    };

    let corps = [];

    if (this.state.showArmy) {
      army.units.corps.forEach(corp => {
        corps.push(
          <div key={corp.id}>
            <Unit unit={corp} headquarters={army.HQ}/>
          </div>
        );
      });
    }

    return(
      <div>
        {this.state.army.HQ.realDate}
        <div className="clear"></div>
        <Player player={player}/>
        {inspected()}
        <div className="clear"></div>
        <button onClick={this.pause.bind(this)}>Pause</button>
        <button onClick={this.show.bind(this)}>Army</button>
        <div>
          {corps}
        </div>
      </div>
    );
  }
}

class Unit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCommander: false,
      headquarters: props.headquarters
    }
  }

  mouseClick (commander) {
    this.showCommander();
    if (!this.state.showCommander) this.setInspected(commander);
  }

  showCommander () {
    this.setState({showCommander: !this.state.showCommander});
  }

  setInspected (commander) {
    this.state.headquarters.officers.inspected = commander;
    console.log(this.state.headquarters);
  }

  render () {
    let unit = this.props.unit;
    let commander;
    let subunits = [];
    if (unit.subunits) {
      unit.subunits.forEach(subunit => {
        subunits.push(
          <div key={subunit.id}>
            <Unit unit={subunit} headquarters={this.state.headquarters}/>
          </div>
        );
      });
    }

    if (this.state.showCommander) {
      commander = <Commander officer={unit.commander}/>;
    }

    return(
      <div className={unit.type}>
        <p onClick={this.mouseClick.bind(this, unit.commander)}>{unit.name}</p>
        {commander}
        {subunits}
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
      <div className="player">
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

class Officer extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let player = this.props.officer;

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
      <div className="inspected">
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
  }

  render () {
    let history = [];
    let title = (this.props.officer.isPlayer) ?
      <div><strong>{this.props.officer.name()}</strong></div> :
      <div>{this.props.officer.name()}</div>;

    return (
      <div>
        {title}
      </div>
    );
  }
}

export default Ui;
