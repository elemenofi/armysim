
//angular controller loads army.json

var army = angular.module('army', []);

function armyController($scope, $http) {
	function getArmyData () {
		$http
			.get('/army')
			.success(function(data) {
				$scope.army = data;
				getArmyData();
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}
	getArmyData();
}