'use strict';

angular.module('core').controller('HeaderController', ['$scope',
	function($scope) {
		
		$scope.date = new Date();
		
	}
]);
