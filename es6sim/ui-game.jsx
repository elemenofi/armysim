import config from './config';
import util from './util';

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
        <p className="date" >{ army.hq.realDate }</p>
        <div className="client">
          <VPlayer className="player-box" player={ army.hq.player } engine={ engine }/>
          <VInspected className="target-box" officer={ army.hq.findInspected() } engine={ engine } />
          <VOperation className="target-box" operation={ army.hq.inspectedOperation } engine={ engine } />
        </div>
        <div className="clear"></div>
        <VOfficer officer={ army.command.commander } engine={ engine }/>
        <VStructure units={ army.command.subunits } engine={ engine } />
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
      unit.isRed = (this.state.engine.army.hq.inspected
      && unit.commander.id === this.state.engine.army.hq.inspected.id
      || unit.commander.isPlayer) ? 'isRed' : ''
      unit.isTarget = (this.state.engine.army.hq.target
      && unit.commander.id === this.state.engine.army.hq.target.id) ? 'isTarget' : '';

      if (unit.painted) return
      if (!unit.painted) unit.painted = true
      if (unit.type === 'squad') unit.displayName = unit.name.split(' ')[0] + '★'
      if (unit.type === 'platoon') unit.displayName = unit.name.split(' ')[0] + '★★'
      if (unit.type === 'company') unit.displayName = unit.name.split(' ')[0] + '★★★'
      if (unit.type === 'battalion') unit.displayName = unit.name.split(' ')[0] + '★★★★'
    })


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

class VBadges extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    let officer = this.props.officer

    function badge () {
      return <div className="badge" style={
          {
            backgroundColor: getRandomColor(),
            width: util.random(5) + 1
          }
        }></div>;
    }

    function getRandomColor() {
      let letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    while (officer.badges.length < officer.experience / 100) {
      officer.badges.push(badge())
    }

    return (<div style={{maxWidth: 65}}>{officer.badges}<div className="clear"> </div></div>)
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
        <div>{ this.state.engine.army.hq.findUnitById(player.unitId).name }</div>
        <VStats officer={ player } engine={ engine } />
        <VStaff officer={ player } engine={ engine } />
        <VOperations officer={ player } engine={ engine } />
      </div>
    );
  }
}

class VOperation extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      operation: this.props.operation,
      engine: this.props.engine
    }
  }

  render () {
    if (!this.props.operation) return (<div></div>)
    let op = this.props.operation;

    let operation = <div>
      <div>{op.name}</div>
      <div><VOfficer officer={op.officer} engine={this.props.engine}/></div>
      <div><VOfficer officer={op.target} engine={this.props.engine}/></div>
      <div>{op.completed}</div>
      <div>{config.operationType[op.type]} {op.name}</div>
      <div>{(op.strength * 300)/1000} % complete</div>

    </div>

    return (
      <div>{operation}</div>
    )
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

  inspectOperation (operation) {
    this.props.engine.army.hq.inspectedOperation = operation
  }

  render () {
    if (!this.props.officer || !this.props.officer.operations.length) return(<div></div>);

    let operations = [];
    let html = <div><ul>{operations}</ul></div>;

    this.props.officer.operations.forEach(operation => {
      if (operation && operation.turns) {
        operations.push(
          <li onClick={this.inspectOperation.bind(this, operation)} className="operation">
            <div>
              <ul>
              <li>{operation.name} {operation.description} {this.props.engine.army.hq.findUnitById(operation.target.unitId).name}</li>
              </ul>
            </div>
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
    let army = this.props.engine.army;

    let spec = {
      type: type,
      officer: army.hq.planner,
      target: army.hq.target,
      byPlayer: true
    };

    army.hq.operations.add(spec, army.hq);

    if (!this.props.engine.running) {
      // pass true as triggeredByUserAction
      this.props.engine.update(true);
      this.props.engine.updateUI(true);
    }
  }

  render () {
    if (!this.props.officer) return (<div></div>)
    let army = this.props.engine.army;
    let officer = this.props.officer;
    let engine = this.props.engine;
    let superior = army.hq.findCommander(officer)
    let target = (army.hq.target) ? army.hq.target.name() : '';
    let headerHTML = (!officer.isPlayer) ?
    <div>
      <VOfficer officer={ officer } engine={ engine }/>
      <div>{ army.hq.findUnitById(officer.unitId).name }</div>
      <VBadges officer={ officer } />
      <VStats officer={ officer } engine={ engine }/>
      <VStaff officer={ officer } engine={ engine }/>
      <VOperations officer={ officer } engine={ engine }/>
    </div> :
    <div></div>;

    return(
      <div className="inspected">
        <p>{engine.army.hq.planner.name() || 'planner'}</p>
        {target}
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
    const staff = [];
    const subordinates = [];
    const army = this.props.engine.army;
    const engine = this.props.engine;
    const officer = this.props.officer;
    let unit = army.hq.findUnitById(officer.unitId);
    const superior = this.props.officer.commander;
    if (!unit) unit = { name: 'No unit' };

    army.hq.findOperationalStaff(this.props.officer).forEach((officer) => {
      staff.push(<li><VOfficer officer={ officer } engine={ engine }/></li>);
    });
    staff.reverse()

    const superiorHTML = (!officer.reserved && officer.rank.hierarchy < 8) ?
    <div className='superior'>
      <div>Commanding Officer</div>
      <VOfficer officer={ superior } engine={ engine }/>
    </div> :
    <div></div>;

    const staffHTML = (staff.length && !this.props.officer.reserved && !this.props.operations) ?
    <div className='inspectedStaff'>
      { superiorHTML }
      <h2>Staff</h2>
      <ul className='staff'>{ staff }</ul>
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
    let html;

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
    let html

    if (this.props.officer) {
      html = <div className='stats'>
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
      html = <div className='stats'></div>
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
    const history = [];

    if (this.props.officer) {
      this.props.officer.history.events.forEach((event) => {
        history.push(<li className='log'>{ event }</li>)
      })
      // if (!this.props.officer.reserved) history = history.slice(0, 2)
      history.reverse()
    }

    const html = (this.props.officer) 
      ? <div className='history'>
          <div>Record</div>
          <ul>{ history }</ul>
        </div> 
      : <div></div>

    return(html)
  }
}

export default VUi
