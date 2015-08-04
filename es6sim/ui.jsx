/* jshint ignore:start */
import React from './react';
import Comparisons from './comparisons';

let comparisons = new Comparisons();

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

  toggleArmy () {
    this.setState({showArmy: !this.state.showArmy});
  }

  togglePeers () {
    this.setState({showPeers: !this.state.showPeers});
  }

  render () {
    let army = this.state.army;
    let player = army.HQ.player;
    let corps = [];
    let peers = [];

    if (this.state.showArmy) {
      army.units.corps.forEach(corp => {
        corps.push(
          <div key={corp.id}>
            <Unit unit={corp} headquarters={army.HQ}/>
          </div>
        );
      });
    }

    if (this.state.showPeers) {
      army.HQ.findPeers(player.rank).sort(comparisons.byExperience).forEach(peer => {
        peers.push(<li>{peer.name()}, {peer.experience}</li>);
      });
    }

    return(
      <div>
        {this.state.army.HQ.realDate}
        <div className="clear"></div>
        <Player player={player} headquarters={army.HQ}/>
        <div className="clear"></div>
        <button onClick={this.pause.bind(this)}>Pause</button>
        <button onClick={this.toggleArmy.bind(this)}>Army</button>
        <button onClick={this.togglePeers.bind(this)}>Peers</button>
        <div>
          {corps}
        </div>
        <ul>
          {peers}
        </ul>
      </div>
    );
  }
}

class Unit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      unit: props.unit,
      showCommander: false,
      headquarters: props.headquarters
    }
  }

  mouseClick () {
    this.showCommander();
  }

  showCommander () {
    this.setState({showCommander: !this.state.showCommander});
  }

  render () {
    let unit = this.state.unit;
    let inspected = () => {
      if (this.state.showCommander) {
        return (<Officer officer={unit.commander} headquarters={this.state.headquarters}/>);
      }
    };
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
        <div>
          {commander}
          {inspected()}
        </div>
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
    let HQ = this.props.headquarters;

    let history = [];
    player.history.forEach(story => {
      history.push(<li>{story}</li>);
    });

    return (
      <div className="player">
        <p>{player.name()}</p>
        <ul>
          <li>Drift {player.drift}</li>
          <li>Alignment {player.alignment}</li>
          <li>Militancy {player.militancy}</li>
          <li>Prestige {player.prestige}</li>
        </ul>
        <ul>
          <li>Diplomacy {player.diplomacy}</li>
          <li>Commanding {player.commanding}</li>
          <li>Intelligence {player.intelligence}</li>
          <li>Administration {player.administration}</li>
        </ul>
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
    this.state = {
      officer: props.officer,
      headquarters: props.headquarters
    }
  }
  render() {
    let player = this.props.officer;

    let history = [];
    player.history.forEach(story => {
      history.push(<li>{story}</li>);
    });

    return (
      <div className="inspected">
        <ul>
          <li>Drift {player.drift}</li>
          <li>Alignment {player.alignment}</li>
          <li>Militancy {player.militancy}</li>
          <li>Prestige {player.prestige}</li>
        </ul>
        <ul>
          <li>Diplomacy {player.diplomacy}</li>
          <li>Commanding {player.commanding}</li>
          <li>Intelligence {player.intelligence}</li>
          <li>Administration {player.administration}</li>
        </ul>
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
