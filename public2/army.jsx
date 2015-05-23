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
        
        var componentType = function () {
        
          switch (subUnit) {
            case "corps":
              return <Corp corp={unit[subUnit][i]} />
            break;
          }
        }

        for (var i=0; i < unit[subUnit].length; i++) {
            subUnits.push(componentType());
        }

        return (
          <div>
            <UnitName unit={unit} />
            &#9733; &#9733; &#9733; &#9733; <UnitCommander commander={unit.commander} />
            <Badges officer={unit.commander} />
            <div style={clearStyle}></div>
            <div>{subUnits}</div>
          </div>
        );

      };

      function drawArmyStructure (army) {
        
        var corps = [];

        for (var i=0; i < army.corps.length; i++) {
            corps.push(<Corp corp={army.corps[i]} />);
        }

        return (
          <div>
            <UnitName unit={army} />
            &#9733; &#9733; &#9733; &#9733; <UnitCommander commander={army.commander} />
            <Badges officer={army.commander} />
            <div style={clearStyle}></div>
            <div>{corps}</div>
          </div>
        );

      };

      function drawCorpStructure (corp) {
        
        var divisions = [];

        for (var i=0; i < corp.divisions.length; i++) {
            divisions.push(<Division division={corp.divisions[i]} />);
        }

        return (
          <div className="corp half">
            <UnitName unit={corp} />
            &#9733; &#9733; &#9733; <UnitCommander commander={corp.commander} />
            <Badges officer={corp.commander} />
            <div style={clearStyle}></div>
            <div>{divisions}</div>
          </div>
        );

      };

      function drawDivisionStructure (division) {
        
        var brigades = [];

        for (var i=0; i < division.brigades.length; i++) {
            brigades.push(<Brigade brigade={division.brigades[i]} />);
        }

        return (
          <div className="division half">
            <UnitName unit={division} />
            &#9733; &#9733; <UnitCommander commander={division.commander} />
            <Badges officer={division.commander} />
            <div style={clearStyle}></div>
            <div>{brigades}</div>
          </div>
        );

      };

      function drawBrigadeStructure (brigade) {
        
        var regiments = [];

        for (var i=0; i < brigade.regiments.length; i++) {
            regiments.push(<Regiment regiment={brigade.regiments[i]} />);
        }

        return (
          <div className="brigade half">
            <UnitName unit={brigade} />
            &#9733; <UnitCommander commander={brigade.commander} />
            <Badges officer={brigade.commander} />
            <div style={clearStyle}></div>
            <div>{regiments}</div>
          </div>
        );

      };

      function drawRegimentStructure (regiment) {
        
        var companies = [];

        for (var i=0; i < regiment.companies.length; i++) {
            companies.push(<Company company={regiment.companies[i]} />);
        }

        return (
          <div className="regiment half">
            <UnitName unit={regiment} />
            &diams; &diams; &diams; &diams; <UnitCommander commander={regiment.commander} />
            <Badges officer={regiment.commander} />
            <div style={clearStyle}></div>
            <div>{companies}</div>
          </div>
        );

      };

      function drawCompanyStructure (company) {
        
        var battalions = [];

        for (var i=0; i < company.battalions.length; i++) {
            battalions.push(<Battalion battalion={company.battalions[i]} />);
        }

        return (
          <div className="company">
            <UnitName unit={company} />
            &diams; &diams; &diams; <UnitCommander commander={company.commander} />
            <Badges officer={company.commander} />
            <div style={clearStyle}></div>
            <div>{battalions}</div>
          </div>
        );

      };

      function drawBattalionStructure (battalion) {
        
        var platoons = [];

        for (var i=0; i < battalion.platoons.length; i++) {
            platoons.push(<Platoon platoon={battalion.platoons[i]} />);
        }

        return (
          <div>
            <UnitName unit={battalion} />
            &diams; &diams; <UnitCommander commander={battalion.commander} />
            <Badges officer={battalion.commander} />
            <div style={clearStyle}></div>
            <div>{platoons}</div>
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
          return drawCorpStructure (this.props.corp);
        }
      });

      var Division = React.createClass({
        render: function() {
          return drawDivisionStructure (this.props.division);
        }
      });

      var Brigade = React.createClass({
        render: function() {
          return drawBrigadeStructure (this.props.brigade);
        }
      });

      var Regiment = React.createClass({
        render: function() {
          return drawRegimentStructure (this.props.regiment);
        }
      });

      var Company = React.createClass({
        render: function() {
          return drawCompanyStructure (this.props.company);
        }
      });

      var Battalion = React.createClass({
        render: function() {
          return drawBattalionStructure (this.props.battalion);
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