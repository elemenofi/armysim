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
          <VPlayer player={ army.HQ.player } engine={ engine }/>
          <VInspected officer={ army.HQ.findInspected() } engine={ engine } />
        </div>
        <VUnit officer={ army.HQ.player }  engine={ engine } />
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

    return(
      <div className="player">
        <div onClick={ this.inspect.bind(this) }>{ player.name() }</div>
        <div>{ this.state.engine.army.HQ.findUnitById(player.unitId).name }</div>
        <VStats officer={ player } engine={ this.state.engine} />
        <VStaff officer={ player } engine={ this.state.engine } />
      </div>
    );
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

  render () {
    if (!this.props.officer) return (<div></div>)
    var army = this.state.engine.army;
    var officer = this.props.officer;
    var engine = this.state.engine;
    var superior = army.HQ.findCommandingOfficer(officer)
    var superiorHTML = (!this.props.officer.reserved && !this.props.officer.isPlayer && this.props.officer.rank.hierarchy < 7) ?
    <div className="superior">
      <div>Commanding Officer</div>
      <VOfficer officer={ superior } engine={ this.state.engine }/>
    </div> :
    <div></div>;
    var headerHTML = (!this.props.officer.isPlayer) ?
    <div>
      <h1>Officer</h1>
      <VOfficer officer={ officer } engine={ this.state.engine }/>
      <VStats officer={ officer } engine={ this.state.engine } />
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
      staff.push(<li><Officer officer={ officer } engine={ this.state.engine }/></li>);
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

    var html = (this.props.officer) ? <div className="stats">
                                        <div>INT { this.props.officer.intelligence }</div>
                                        <div>MIL { this.props.officer.commanding }</div>
                                        <div>DIP { this.props.officer.diplomacy }</div>
                                      </div> :
                                      <div className="stats"></div>;

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
    var targetId = this.state.target;
    var spec = {
      name: this.state.name,
      type: this.state.type,
      officer: army.HQ.findStaffById(staffOfficerId, playerUnitId),
      target: army.HQ.findOfficerById(targetId)
    };
    army.HQ.operations.add(spec);
    document.getElementById('operationType').selectedIndex = '0';
    document.getElementById('operationOfficer').selectedIndex = '0';
    document.getElementById('operationTarget').selectedIndex = '0';
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

  handleSearch (event) {
    this.setState({targets: this.state.engine.army.HQ.findOfficersByName(event.target.value) });
  }

  render () {
    let army = this.state.engine.army;
    let player = this.state.player;
    let targets = (this.state.targets) ? this.state.targets : army.HQ.findActiveOfficers();

    let types = ['commanding', 'intelligence', 'diplomacy'];
    let staff = army.HQ.findOperationalStaff(player);

    let operationTypes = [];
    let officers = [];
    let staffOfficers = [];

    types.forEach(type => {
      operationTypes.push(<option>{ type }</option>);
    });

    staff.forEach(officer => {
      staffOfficers.push( <option value={ [officer.id, player.unitId] }>{ officer.name() }</option> );
    });

    targets.forEach(target => {
      officers.push( <option value={ target.id }>{ target.name() }</option> );
    });

    operationTypes.unshift(<option></option>);
    officers.unshift(<option></option>);
    staffOfficers.unshift(<option></option>);

    return(
      <div className="unit">
        <h1>Headquarters</h1>
        <div>Operation name</div>
        <input onChange={ this.handleName.bind(this) }/>
        <div>Type</div>
        <select id="operationType" onChange={ this.handleType.bind(this) }>
          { operationTypes }
        </select>
        <div>Commander</div>
        <select id="operationOfficer" onChange={ this.handleOfficer.bind(this) }>
          { staffOfficers }
        </select>
        <div>Target</div>
        <input type="text" onChange={ this.handleSearch.bind(this) }/>
        <select id="operationTarget" onChange={ this.handleTarget.bind(this) }>
          { officers }
        </select>
        <button onClick={ this.startOperation.bind(this) }>
          Start Operation
        </button>
      </div>
    );
  }
}

export default VUi;
