'use strict';

angular.module('core').controller('HomeController', ['$scope',
	function($scope) {
		$scope.date = new Date();
	}
]);
