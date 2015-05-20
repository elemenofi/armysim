var army = angular.module('army', []);

army.controller('armyController', [ '$scope', '$http', '$timeout', '$filter', '$window',
  function ($scope, $http, $timeout, $filter, $window) {
    var api = '/army'

    function updateArmy () {
      $timeout(function(){
        $http.get(api)
          .success(function (data) {
            $scope.army = data;
            // console.log(data);
          })
          .then(updateArmy);
      }, 2000);
    };

    updateArmy();

    $scope.inspectToggle = function (officer) {
      $http.post(api + "/inspect", officer)
        .success(function(data) {
          // console.log(data);
        });
    };

    $scope.inspectReset = function () {
      $http.get(api + "/inspectReset")
        .success(function(data) {
          // console.log(data);
        });
    };

    $scope.turnsToggle = function () {
      $http.get(api + "/turns", null)
        .success(function(data) {
          // console.log(data);
        });
    };

  }
]);
