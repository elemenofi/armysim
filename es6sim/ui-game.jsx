// import * as React from './lib/react'
import Army from './typings';
import config from './config';

class VUi extends React.Component {
  constructor (spec) {
    super (spec);
    this.engine = spec;
  }

  render (army) {
    ReactDOM.render(<VArmy engine={ this.engine } />, document.body);
  }
}

class VArmy extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      army: props.engine.army,
      engine: props.engine
    }
  }

  render () {

    var army = this.props.engine.army;
    var engine = this.state.engine;
    return(
      <div className="army">
        <p className="date" >{ army.HQ.realDate }</p>
        <div className="client">
          <VPlayer className="player-box" player={ army.HQ.player } engine={ engine }/>
          <VInspected className="target-box" officer={ army.HQ.findInspected() } engine={ engine } />
        </div>
        <div className="clear"></div>
        <VStructure units={ army.units.corps } engine={ engine } />
      </div>
    );
  }
}

class VStructure extends React.Component {
  props;
  state;
  constructor (props) {
    super (props);
    this.state = {
      units: this.props.units,
      engine: this.props.engine
    };
  }

  inspect (commander) {
    let engine = this.props.engine;
    if (engine) engine.actions.inspect(commander[0].id);
  }

  render () {
    let units = this.state.units;
    if (units.length < 2) return(<div></div>)
    let names = [];

    units.forEach(unit => {
      unit.isRed = (this.state.engine.army.HQ.officers.inspected
      && unit.commander.id === this.state.engine.army.HQ.officers.inspected.id
      || unit.commander.isPlayer) ? 'isRed' : '';
      unit.isTarget = (this.state.engine.army.HQ.target
      && unit.commander.id === this.state.engine.army.HQ.target.id) ? 'isTarget' : '';

      if (unit.painted) return
      if (!unit.painted) unit.painted = true
      if (unit.type === 'squad') unit.displayName = unit.name.split(' ')[0] + '★'
      if (unit.type === 'platoon') unit.displayName = unit.name.split(' ')[0] + '★★'
      if (unit.type === 'company') unit.displayName = unit.name.split(' ')[0] + '★★★'
      if (unit.type === 'battalion') unit.displayName = unit.name.split(' ')[0] + '★★★★'
    });


    return(
      <div>
        <div className={units[0].type + ' ' + units[0].isRed + ' ' + units[0].isTarget}>
          <div onClick={ this.inspect.bind(this, [units[0].commander]) }>{units[0].displayName || units[0].name}</div>
          <VStructure units={units[0].subunits} engine={this.state.engine} />
        </div>
        <div className={units[1].type  + ' ' + units[1].isRed + ' ' + units[1].isTarget}>
          <div onClick={ this.inspect.bind(this, [units[1].commander]) }>{units[1].displayName || units[1].name}</div>
          <VStructure units={units[1].subunits} engine={this.state.engine} />
        </div>
      </div>
    );
  }
}

class VPlayer extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      player: this.props.player,
      engine: this.props.engine
    };
  }

  inspect () {
    if (this.props.engine) this.props.engine.actions.inspect(this.props.player.id);
  }

  render () {
    if (!this.state.player) return

    let army = this.state.engine.army;
    let player = this.state.player;
    let engine = this.state.engine;

    return(
      <div className="player">
        <div onClick={ this.inspect.bind(this) }>{ player.name() }</div>
        <div>{ this.state.engine.army.HQ.findUnitById(player.unitId).name }</div>
        <VStats officer={ player } engine={ engine } />
        <VStaff officer={ player } engine={ engine } />
        <VOperations officer={ player } engine={ engine } />
      </div>
    );
  }
}

class VOperations extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      officer: this.props.officer,
      engine: this.props.engine
    }
  }
  render () {
    if (!this.props.officer || !this.props.officer.operations.length) return(<div></div>);

    let operations = [];
    let html = <div><ul>{operations}</ul></div>;

    this.props.officer.operations.forEach(operation => {
      if (operation && operation.turns) {
        operations.push(
          <li className="operation">
            <div>{config.operationType[operation.type]} {operation.name}</div>
            <div>{(operation.strength * 300)/1000} % complete</div>
            <div>{operation.officer.name()} </div>
            <div>{operation.target.name()} </div>
          </li>
        )
      }
    })

    return(html)
  }
}

class VInspected extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      officer: this.props.officer,
      engine: this.props.engine
    }
  }

  startCoup () {
    this.startOperation('commanding')
  }

  startPlot () {
    this.startOperation('diplomacy')
  }

  startOperation (type) {
    var army = this.props.engine.army;
    var word = chance.word(4)
    word = word.replace(/\b\w/g, l => l.toUpperCase())

    var spec = {
      name: 'Operation ' + word,
      type: type,
      officer: army.HQ.planner,
      target: army.HQ.target,
      byPlayer: true
    };

    army.HQ.operations.add(spec, army.HQ);

    if (!this.props.engine.running) {
      //pass true as triggeredByUserAction
      this.props.engine.update(true);
      this.props.engine.updateUI(true);
    }
  }

  render () {
    if (!this.props.officer) return (<div></div>)
    var army = this.props.engine.army;
    let officer = this.props.officer;
    var engine = this.props.engine;
    var superior = army.HQ.findCommandingOfficer(officer)

    var headerHTML = (!officer.isPlayer) ?
    <div>
      <VOfficer officer={ officer } engine={ engine }/>
      <div>{ army.HQ.findUnitById(officer.unitId).name }</div>
      <VStats officer={ officer } engine={ engine }/>
      <VStaff officer={ officer } engine={ engine }/>
      <VOperations officer={ officer } engine={ engine }/>
    </div> :
    <div></div>;


    return(
      <div className="inspected">
        <p>{engine.army.HQ.planner.name() || 'planner'}</p>
        <p>{engine.army.HQ.target.name() || 'target'}</p>
        <p onClick={ this.startCoup.bind(this) }>
          Coup
        </p>
        <p onClick={ this.startPlot.bind(this) }>
          Plot
        </p>
        { headerHTML }
        <VHistory officer={ officer } engine={ engine } />
      </div>
    );

  }
}

class VStaff extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      officer: this.props.officer,
      engine: this.props.engine,
      operations: this.props.operations
    };
  }

  render () {
    var staff = [];
    var subordinates = [];
    var army = this.props.engine.army;
    var engine = this.props.engine;
    var officer = this.props.officer;
    var unit = army.HQ.findUnitById(officer.unitId);
    var superior = this.props.officer.commander;
    if (!unit) unit = { name: 'No unit' };

    army.HQ.findOperationalStaff(this.props.officer).forEach(officer => {
      staff.push(<li><VOfficer officer={ officer } engine={ engine }/></li>);
    });
    staff.reverse()

    var superiorHTML = (!officer.reserved && officer.rank.hierarchy < 7 && !this.state.operations) ?
    <div className="superior">
      <div>Commanding Officer</div>
      <VOfficer officer={ superior } engine={ engine }/>
    </div> :
    <div></div>;

    var staffHTML = (staff.length && !this.props.officer.reserved && !this.props.operations) ?
    <div className="inspectedStaff">
      { superiorHTML }
      <h2>Staff</h2>
      <ul className="staff">{ staff }</ul>
    </div> :
    <div>
      { superiorHTML }
    </div>;

    return(staffHTML);
  }
}

class VOfficer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      engine: this.props.engine,
      officer: this.props.officer
    }
  }

  inspect (event) {
    if (this.props.engine) this.props.engine.actions.inspect(this.props.officer.id);
  }

  render () {
    var html;

    if (this.props.officer) {
      html = <div>
        <div onClick={ this.inspect.bind(this) }>{ this.props.officer.name() }</div>
      </div>
    } else {
      html = <div></div>
    }

    return(html);
  }
}

class VStats extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      engine: this.props.engine,
      officer: this.props.officer
    }
  }

  render () {
    var html

    if (this.props.officer) {
      html = <div className="stats">
        <div>EXP { this.props.officer.experience } / {this.props.officer.rank.maxxp}</div>
        <div>PRE { this.props.officer.prestige }</div>
        <div>PAR { this.props.officer.party }</div>
        <div>MIT { this.props.officer.militancy }</div>
        <div>ALI { this.props.officer.alignment }</div>
        <div>DRI { this.props.officer.drift }</div>
        <div>INT { this.props.officer.intelligence }</div>
        <div>MIL { this.props.officer.commanding }</div>
        <div>DIP { this.props.officer.diplomacy }</div>
      </div>
    } else {
      html = <div className="stats"></div>
    }

    return(html);
  }
}

class VHistory extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      engine: this.props.engine,
      officer: this.props.officer
    }
  }

  render () {
    var history = [];

    if (this.props.officer) {
      this.props.officer.history.forEach((event) => {
        history.push(<li className="log">{ event }</li>)
      })
      // if (!this.props.officer.reserved) history = history.slice(0, 2)
      history.reverse()
    }

    var html = (this.props.officer) ? <div className="history">
                                        <div>Record</div>
                                        <ul>{ history }</ul>
                                      </div> : <div></div>;

    return(html);
  }
}

export default VUi;
