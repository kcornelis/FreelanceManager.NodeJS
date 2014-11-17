'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$window', 'jwtHelper',
	function($scope, $window, jwtHelper) {
		$scope.date = new Date();

		var token = jwtHelper.decodeToken($window.sessionStorage.token);

		$scope.fullName = token.fullName;
	}
]);
