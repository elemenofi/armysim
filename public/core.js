var army = angular.module('army', []);

function armyController($scope, $http) {
	setInterval(function() {
		$http.get('/army')
			.success(function(data) {
				$scope.officers = data;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}, 1000 );
	
}