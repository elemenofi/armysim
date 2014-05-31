
//angular controller loads army.json

var army = angular.module('army', []);

function armyController($scope, $http) {
	var no_errors = true;
	function getArmyData () {
		$http
			.get('/army')
			.success(function(data) {
				$scope.army = data;
				getArmyData();
			})
			.error(function(data) {
				console.log('Error: ' + data);
				no_errors = false;
			});
	}
	if (no_errors) {
		getArmyData();
	}
}