var army = angular.module('army', []);

function armyController($scope, $http) {
	setInterval(function() {
		$http.get('/army')
			.success(function(data) {
				$scope.army = data;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}, 500 );
}