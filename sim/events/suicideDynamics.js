var armyEngine = require('../armyEngine');
var staffRetire = require('../staff/staffRetire');
var values = require('../data/values');

var suicideDynamics = (function (army) {
	
	var suicide = function (officer) {
		
		officer.suicided = true;
		staffRetire.retireSpecificOfficer(
			officer, 
			armyEngine.army(), 
			values.suicideMessage.suicide(
				officer, 
				armyEngine.army().formatedDate
			)
		);
	
	};

	var checkSuicidals = function (army) {
		
		armyEngine.army().staff.map(function (officer) {
			
			if (officer.prestige < 0 && !officer.suicided) {
	
				suicide(officer);
	
			};
		
		});
	
	};

	return {

		checkSuicidals: checkSuicidals
	
	};

})();

exports.update = suicideDynamics.checkSuicidals;