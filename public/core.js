var army = angular.module('army', []);

army.controller('armyController', [ '$rootScope', '$scope', '$http', '$timeout', '$filter', '$window',
  function ($rootScope, $scope, $http, $timeout, $filter, $window) {
    var api = '/army'

    $scope.playing = true;

    function updateArmy () {

      setTimeout(function(){

        $scope.$apply(function() {

          if ($scope.playing) {

            $http.get(api)
            .success(function (data) {
              $scope.army = data;
            })


          };

        });

      }, 500);

    };

    updateArmy();

    $scope.inspectToggle = function (officer) {

      $http.post(api + "/inspect", officer)
        .success(function(data) {
        });

    };

    $scope.inspectReset = function () {

      $http.post(api + "/inspectReset", null)
        .success(function(data) {
        });

    };

    $scope.turnsToggle = function () {

      $scope.playing = !$scope.playing;

      if ($scope.playing) {
        updateArmy();
      };

      $http.get(api + "/turns", null)
        .success(function(data) {
        });

    };

  }
]);
