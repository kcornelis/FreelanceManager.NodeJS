angular.module('core').controller('AppController', ['$rootScope', '$scope', '$state', '$window', '$timeout',
function($rootScope, $scope, $state, $window, $timeout) {
	'use strict';

	$rootScope.currTitle = $state.current.title;
	$rootScope.pageTitle = function() {
		return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
	};
}]);
