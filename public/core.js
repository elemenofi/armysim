var army = angular.module('army', []);

army.controller('armyController', [ '$scope', '$http', '$timeout',
  function ($scope, $http, $timeout) {
    var api = '/army'

    function updateArmy () {
      $timeout(function(){
        $http.get(api)
          .success(function (data) {
            $scope.army = data;
            console.log(data.divisions);
          })
          .then(updateArmy);
      }, 2000);
    };

    updateArmy();
  }
]);