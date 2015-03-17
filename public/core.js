
//angular controller loads army.json

var army = angular.module('army', []);

army.controller('armyController', ['$scope', '$http', '$timeout',
  function armyController($scope, $http, $timeout) {
    function getData () {
      $http.get('/army')
        .success(function(data) {
          $scope.army = data;
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    }
    var timer = setInterval(function() {
      $scope.$apply(getData);
    }, 1000);
  }
]);