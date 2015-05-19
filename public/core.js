var army = angular.module('army', []);

army.controller('armyController', [ '$scope', '$http', '$timeout',
  function ($scope, $http, $timeout) {
    var api = '/army'

    function updateArmy () {
      $timeout(function(){
        $http.get(api)
          .success(function (data) {
            $scope.army = data;
            console.log(data);
          })
          .then(updateArmy);
      }, 2000);
    };

    updateArmy();

    $scope.inspectToggle = function (officer) {
      $http.post(api + "/inspect", officer)
        .success(function(data) {
          console.log(data);
        });
    };

    $scope.getBondName = function (bond) {
      $http.get(api + "bondname", {id: bond})
        .success(function(data) {
          console.log(data);
        });
    };

    $scope.riftDirection = function (rift) {
      if (rift > 500) {
        return ">>>";
      } else {
        return "<<<";
      }
    };
  }
]);
