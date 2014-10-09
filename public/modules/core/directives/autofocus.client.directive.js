'use strict';

angular.module('core').directive('autofocus', function($timeout, $parse) {
  return {
    link: function(scope, element, attrs) {
          $timeout(function() {
            element[0].focus(); 
          }, 100);
    }
  };
});