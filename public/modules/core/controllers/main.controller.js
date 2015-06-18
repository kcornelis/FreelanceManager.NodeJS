(function() {
	'use strict';

	function controller($rootScope, $scope, $state) {
		$rootScope.currTitle = $state.current.title;
		$rootScope.pageTitle = function() {
			return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
		};
	}

	controller.$inject = ['$rootScope', '$scope', '$state'];

	angular.module('fmCore').controller('AppController', controller);
})();
