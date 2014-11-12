'use strict';

// TODO unit test this directive

angular.module('core').directive('fmActiveMenuItem', ['$state', '$stateParams', '$interpolate', function($state, $stateParams, $interpolate) {
  return {
    restrict: "A",
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      var state, params, activeClass;

      state = $attrs.fmActiveMenuItem || '';

      $scope.$on('$stateChangeSuccess', update);

      // Update route state
      function update() {
        if ($state.$current.self.name.indexOf(state) == 0) {
          $element.addClass('active');
        } else {
          $element.removeClass('active');
        }
      }
    }]
  };
}]);