var army;
    var message;

    $(document).ready(function () {

      function getArmy () {

        $.get('army').success(function (data) {
          
          army = data;

          console.log(data);

          renderArmy(army);           

        });

      };

      function renderArmy (army) {

        rendered = true;

        React.render(
          <Army army={army} />,
          document.body
        );
      
      };

      var clearStyle = {
        clear: 'both'
      };

      function drawUnit(unit, subUnit) {
        var subUnits = [];
        var className = '';

        var componentType = function () {
        
          switch (subUnit) {
            case "corps":
              className = 'army';
              return <Corp corp={unit[subUnit][i]} />
            break;
            case "divisions":
              className = 'corp';
              return <Division division={unit[subUnit][i]} />
            break;
            case "brigades":
              className = 'division';
              return <Brigade brigade={unit[subUnit][i]} />
            break;
            case "regiments":
              className = 'brigade';
              return <Regiment regiment={unit[subUnit][i]} />
            break;
            case "companies":
              className = 'regiment';
              return <Company company={unit[subUnit][i]} />
            break;
            case "battalions":
              className = 'company';
              return <Battalion battalion={unit[subUnit][i]} />
            break;
            case "platoons":
              className = 'battalion';
              return <Platoon platoon={unit[subUnit][i]} />
            break;
          }
        }
        

        for (var i=0; i < unit[subUnit].length; i++) {
          subUnits.push(componentType());
        }

        return (
          <div className={className}>
            <UnitName unit={unit} />
            <Rank commander={unit.commander} /> <UnitCommander commander={unit.commander} />
            <Badges officer={unit.commander} />
            <div style={clearStyle}></div>
            {subUnits}
          </div>
        );

      };

      function drawPlatoonStructure (platoon) {
        
        return (
          <div>
            <UnitName unit={platoon} />
            &diams; <UnitCommander commander={platoon.commander} />
            <Badges officer={platoon.commander} />
          </div>
        );

      };

      var Army = React.createClass({
        render: function () {
          return drawUnit (this.props.army, "corps");
        }
      });

      var Corp = React.createClass({
        render: function() {
          return drawUnit (this.props.corp, "divisions");
        }
      });

      var Division = React.createClass({
        render: function() {
          return drawUnit (this.props.division, "brigades");
        }
      });

      var Brigade = React.createClass({
        render: function() {
          return drawUnit (this.props.brigade, "regiments");
        }
      });

      var Regiment = React.createClass({
        render: function() {
          return drawUnit (this.props.regiment, "companies");
        }
      });

      var Company = React.createClass({
        render: function() {
          return drawUnit (this.props.company, "battalions");
        }
      });

      var Battalion = React.createClass({
        render: function() {
          return drawUnit (this.props.battalion, "platoons");
        }
      });

      var Platoon = React.createClass({
        render: function() {
          return drawPlatoonStructure (this.props.platoon);
        }
      });

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

      function drawBadges (badges) {
      
        var badgeHolder = [];

        for (var i = 1; i < badges.length; i++) {
          
          var divStyle = {
            backgroundColor: badges[i].bg,
            width: badges[i].x,
            height: badges[i].y
          };

          badgeHolder.push(<div style={divStyle}></div>)
        
        };

        return (
        
          <div className="badgeHolder">
            <div className="badges">{badgeHolder}</div>
            <div style={clearStyle}></div>
          </div>
        
        );

      };

      setInterval(function(){
        getArmy();        
      }, 2000);

    });