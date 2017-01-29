import * as React from './lib/react'
import Army from './typings';

class VUi extends React.Component {
  constructor (spec) {
    super (spec);
    this.engine = spec;
  }

  render (army) {
    React.render(<VArmy engine={ this.engine } />, document.body);
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
    var army = this.state.army;
    var engine = this.state.engine;
    return(
      <div className="army">
        <p className="date" >{ army.HQ.realDate }</p>
        <div>
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
    });

    return(
      <div>
        <div className={units[0].type + ' ' + units[0].isRed}>
          <div onClick={ this.inspect.bind(this, [units[0].commander]) }>{units[0].name}</div>
          <VStructure units={units[0].subunits} engine={this.state.engine} />
        </div>
        <div className={units[1].type  + ' ' + units[1].isRed}>
          <div onClick={ this.inspect.bind(this, [units[1].commander]) }>{units[1].name}</div>
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
        <VUnit officer={ player }  engine={ engine } />
        <VOperations officer={ player } engine={engine} />
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
    console.log(this.state.officer);
    if (!this.state.officer || !this.state.officer.operations.length) return(<div></div>);

    let operations = [];
    let html = <div><ul>{operations}</ul></div>;
    this.state.officer.operations.forEach(operation => {
      operations.push(<li>
        <div>{operation.strength}</div>
      </li>)
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

  target () {
    if (this.props.engine) this.props.engine.actions.target(this.props.officer.id);
  }

  render () {
    if (!this.props.officer) return (<div></div>)
    var army = this.state.engine.army;
    let officer = this.props.officer;
    var engine = this.state.engine;
    var superior = army.HQ.findCommandingOfficer(officer)

    var superiorHTML = (!officer.reserved && !officer.isPlayer && officer.rank.hierarchy < 7) ?
    <div className="superior">
      <div>Commanding Officer</div>
      <VOfficer officer={ superior } engine={ engine }/>
    </div> :
    <div></div>;

    var headerHTML = (!officer.isPlayer) ?
    <div onClick={this.target.bind(this)}>
      <VOfficer officer={ officer } engine={ engine }/>
      <VStats officer={ officer } engine={ engine } />
    </div> :
    <div></div>;


    return(
      <div className="inspected">
        { headerHTML }
        { superiorHTML }
        <VHistory officer={ officer } engine={ this.state.engine } />
      </div>
    );

  }
}

class VStaff extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      officer: this.props.officer,
      engine: this.props.engine
    };
  }

  render () {
    var staff = [];
    var subordinates = [];
    var army = this.state.engine.army;
    var unit = army.HQ.findUnitById(this.state.officer.unitId);
    var superior = army.HQ.findCommandingOfficer(this.state.officer);
    if (!unit) unit = { name: 'No unit' };

    army.HQ.findOperationalStaff(this.state.officer).forEach(officer => {
      staff.push(<li><VOfficer officer={ officer } engine={ this.state.engine }/></li>);
    });

    var superiorHTML = (!this.state.officer.reserved) ?
    <div>
      <div>Commanding Officer</div>
      <VOfficer officer={ superior } engine={ this.state.engine }/>
    </div> :
    null;

    var staffHTML = (staff.length && !this.state.officer.reserved) ?
    <div>
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

  inspect () {
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
    }

    var html = (this.props.officer) ? <div className="history">
                                        <div>Record</div>
                                        <ul>{ history }</ul>
                                      </div> : <div></div>;

    return(html);
  }
}

class VUnit extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      player: this.props.officer,
      engine: this.props.engine,
      name: undefined,
      type: undefined,
      officer: undefined,
      target: undefined,
      targets: undefined
    }
  }

  startOperation () {
    if (!this.state.type || !this.state.officer || !this.state.target) {
      alert('Complete operation details first.');
      return;
    }
    var army = this.state.engine.army;
    var staffOfficerId = this.state.officer.split(',')[0];
    var playerUnitId = this.state.officer.split(',')[1];
    var targetId = this.state.target.id;
    var spec = {
      name: 'Operation ' + army.HQ.findOfficerById(staffOfficerId).lname,
      type: this.state.type,
      officer: army.HQ.findOfficerById(staffOfficerId),
      target: army.HQ.findOfficerById(targetId)
    };
    army.HQ.operations.add(spec);
    document.getElementById('operationType').selectedIndex = '0';
    document.getElementById('operationOfficer').selectedIndex = '0';
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

  handleClickTarget () {
    this.setState({target: this.state.engine.army.HQ.target})
  }

  handleSearch (event, selected) {
    if (!selected) {
      this.state.engine.army.HQ.target = undefined;
      this.setState({targets: this.state.engine.army.HQ.findOfficersByName(event.target.value) });
    } else {
      this.setState({targets: this.state.engine.army.HQ.findOfficersByName(selected) });
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (
      prevState.target &&
      this.state.engine.army.HQ.target &&
      this.state.engine.army.HQ.target.lname !== prevState.target.lname
    ) {
      this.handleSearch(undefined, this.state.engine.army.HQ.target.name())
    } else if (this.state.engine.army.HQ.target && !prevState.target) {
      this.handleSearch(undefined, this.state.engine.army.HQ.target.name())
    }

    this.state.target = this.state.engine.army.HQ.target;
  }

  render () {
    let army = this.state.engine.army;
    let player = this.state.player;
    let targets = (this.state.targets) ? this.state.targets : army.HQ.findActiveOfficers();

    let types = ['military', 'intelligence', 'diplomacy'];
    let staff = army.HQ.findOperationalStaff(player, self);

    let operationTypes = [];
    let officers = [];
    let staffOfficers = [];

    let selectedTarget = (this.state.target && this.state.target.name) ? this.state.target.name() : '';

    types.forEach(type => {
      operationTypes.push(<option>{ type }</option>);
    });

    staff.forEach(officer => {
      staffOfficers.push( <option value={ [officer.id, player.unitId] }>{ officer.name() }</option> );
    });

    if (!this.state.target) {
      targets.forEach(target => {
        officers.push( <option value={ target.id }>{ target.name() }</option> );
      });
    } else if (this.state.target && this.state.target.name) {
      officers.push( <option value={ this.state.target.id }>{ this.state.target.name() }</option> );
    }

    operationTypes.unshift(<option></option>);
    officers.unshift(<option></option>);
    staffOfficers.unshift(<option></option>);

    return(
      <div className="unit">
        <h1>Operation type and commander</h1>
        <select id="operationType" onChange={ this.handleType.bind(this) }>
          { operationTypes }
        </select>
        <select id="operationOfficer" onChange={ this.handleOfficer.bind(this) }>
          { staffOfficers }
        </select>
        <button onClick={ this.startOperation.bind(this) }>
          Start Operation
        </button>
      </div>
    );
  }
}

export default VUi;
