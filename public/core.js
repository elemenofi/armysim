var army = angular.module('army', []);

army.controller('armyController', [ '$rootScope', '$scope', '$http', '$timeout', '$filter', '$window',
  function ($rootScope, $scope, $http, $timeout, $filter, $window) {
    var api = '/army'

    $scope.playing = true;

    function updateArmy () {
      $timeout(function(){
        
        $scope.$apply(function() {
          
          if ($scope.playing) {
          
            $http.get(api)
            .success(function (data) {
              $scope.army = data;
              console.log(data);
            })
            .then(updateArmy);  
          
          };
        
        });

      }, 2000);
    };

    
    
    updateArmy();

    $scope.inspectToggle = function (officer) {
      console.log("inspect");
      $http.post(api + "/inspect", officer)
        .success(function(data) {
          // console.log(data);
        });
    };

    $scope.inspectReset = function () {
      console.log("inspectReset");
      $http.post(api + "/inspectReset", null)
        .success(function(data) {
          // console.log(data);
        });
    };

    $scope.turnsToggle = function () {
      $scope.playing = !$scope.playing;

      if ($scope.playing) {
        updateArmy();
      };

      $http.get(api + "/turns", null)
        .success(function(data) {
          // console.log(data);
        });
    };

  }
]);
