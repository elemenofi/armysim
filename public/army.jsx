var army;
var message;

var socket = io('http://localhost:8000');

socket.on('army', function(armyData) {
  army = armyData;
  renderArmy(army); 
});

function renderArmy (army) {

  rendered = true;

  React.render(
    <div>
      <p>{army.date}</p>
      <Army unit={army} />
      <Pause /> <Clear />
      <Inspecting />
    </div>,
    document.body
  );

};

var clearStyle = {

  clear: 'both'

};
var Inspecting = React.createClass({

  
  getInitialState: function() {
      return {inspected: true};
  },
  
  onClick: function () {
    this.setState({inspected: !this.state.inspected});
  },
  
  render: function () {
    
    var inspecting = [];
    
    if (army.inspecting) {

      for (var i = 0; i < army.inspecting.length; i++) {
    
        inspecting.push(
          <div className="inspecting" key={army.inspecting[i].id}>
            <History officer={army.inspecting[i]} />
          </div>      
        );
    
      };
    
    }
    
    return (<div>{inspecting}</div>);
  }

});


var generateUnitClass = function (unit, subUnit) {
  
  var newClass = React.createClass({
    
    getInitialState: function() {
        return {inspected: this.props.unit.commander.inspecting};
    },
    
    componentWillReceiveProps: function () {
      this.setState({inspected: false});
      this.setState({inspected: this.props.unit.commander.inspecting});    
    },
    
    onClick: function () {
      this.setState({inspected: !this.state.inspected});
      this.props.unit.commander.inspecting = true;
      socket.emit('inspect', { officer: this.props.unit.commander });
    },
    
    render: function () {
      return drawUnit (this.props.unit, subUnit, this);
    }
  
  });  

  return newClass;
      
};


function drawUnit(unit, subUnit, that) {

  var subUnits = [];
  var className = '';

  var componentType = function () {
  
    switch (subUnit) {

      case "corps":
        className = 'army';
        headerName = 'armyHeader';
        return <Corp unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "divisions":
        className = 'corp';
        headerName = 'corpHeader';
        return <Division unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "brigades":
        className = 'division';
        headerName = 'brigadeHeader';

        return <Brigade unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "regiments":
        className = 'brigade';

        return <Regiment unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "companies":
        className = 'regiment';
        return <Company unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "battalions":
        className = 'company';
        return <Battalion unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

      case "platoons":
        className = 'battalion';
        return <Platoon unit={unit[subUnit][i]} key={unit[subUnit][i].id} />
      break;

    }

  }

  if (subUnit) {

    for (var i=0; i < unit[subUnit].length; i++) {
      subUnits.push(componentType());
    };

  };

  var history;

  if (that && that.state.inspected) {
    history = <History officer={unit.commander} />;
  };

  var valedictorian;

  if (that && unit.commander.valedictorian) {
    valedictorian = <div className="valedictorian">&curren;</div>;
  };
  
  return (
    <div className={className}>
      <div className={headerName} onClick={that.onClick}>
        <Rank commander={unit.commander} /> 
        <UnitName unit={unit} />
        <UnitCommander commander={unit.commander} />
        <Badges officer={unit.commander} />
        {valedictorian}
        <div style={clearStyle}></div>
      </div>
      {subUnits}
    </div>
  );

};

var Pause = React.createClass({
  
  onClick: function () {
    socket.emit('pause');
  },
  
  render: function () {
    return (<p onClick={this.onClick}>Pause the game</p>);
  }

});

var Clear = React.createClass({
  
  onClick: function () {
    socket.emit('clear');
  },
  
  render: function () {
    return (<p onClick={this.onClick}>Clear inspected</p>);
  }

});

var Army = generateUnitClass("army", "corps");
var Corp = generateUnitClass("corps", "divisions");
var Division = generateUnitClass("divisions", "brigades");
var Brigade = generateUnitClass("brigades", "regiments");
var Regiment = generateUnitClass("regiments", "companies");
var Company = generateUnitClass("companies", "battalions");
var Battalion = generateUnitClass("battalions", "platoons");
var Platoon = generateUnitClass("platoons");

var UnitName = React.createClass({
  render: function() {
    return (
      <p>{this.props.unit.name}</p>

    );
  }
});

var Rank = React.createClass({
  render: function() {
    switch (this.props.commander.rank) {
      case "Captain":
        return (<p>&diams;</p>);
      break;
      case "Major":
        return (<p>&diams; &diams;</p>);
      break;
      case "Lieutenant Coronel":
        return (<p>&diams; &diams; &diams;</p>);
      break;
      case "Coronel":
        return (<p>&diams; &diams; &diams; &diams;</p>);
      break;
      case "Brigade General":
        return (<p>&#9733;</p>);
      break;
      case "Division General":
        return (<p>&#9733; &#9733;</p>);
      break;
      case "Lieutenant General":
        return (<p>&#9733; &#9733; &#9733;</p>);
      break;
      case "General":
        return (<p>&#9733; &#9733; &#9733; &#9733;</p>);
      break;
      default:
        return (<p>{commander.rank} {commander.firstName} {commander.lastName}</p>);
    }
  }
});

var UnitCommander = React.createClass({
  render: function() {
    return drawNames(this.props.commander);
  }
});

var Badges = React.createClass({
  render: function() {
    return drawBadges(this.props.officer.badges);
  }
});

var History = React.createClass({

  render: function() {

    return drawHistories(this.props.officer);

  }

});

function drawNames (commander) {

  switch (commander.rank) {

    case "Captain":
      return (<p>{commander.lastName}</p>);
    break;

    case "Major":
      return (<p>Mj. {commander.lastName}</p>);
    break;

    case "Lieutenant Coronel":
      return (<p>Lt. Coronel {commander.lastName}</p>);
    break;

    case "Coronel":
      return (<p>{commander.rank} {commander.lastName}</p>);
    break;

    case "Brigade General":
      return (<p>{commander.rank} {commander.lastName}</p>);
    break;

    default:
      return (<p>{commander.rank} {commander.firstName} {commander.lastName}</p>);
  }

} 

function drawBadges (badges) {

  var badgeHolder = [];

  for (var i = 1; i < badges.length; i++) {
    
    var divStyle = {

      backgroundColor: badges[i].bg,
      width: badges[i].x,
      height: badges[i].y

    };

    badgeHolder.push(<div style={divStyle} key={badges[i].id}></div>)
  
  };

  return (
  
    <div className="badgeHolder">
      <div className="badges">{badgeHolder}</div>
      <div style={clearStyle}></div>
    </div>
  
  );

};

function drawHistories (officer) {

  var history = [];

  for (var i = 1; i < officer.history.length; i++) {

    history.push(<div>{officer.history[i]}</div>)
  
  };

  return (
  
    <div className="history">
      <div><Rank commander={officer} />  {officer.rank} {officer.firstName} {officer.lastName}</div>
      <Badges officer={officer} />
      <div className="histories">{history}</div>
      <div style={clearStyle}></div>
    </div>
  
  );

};

  