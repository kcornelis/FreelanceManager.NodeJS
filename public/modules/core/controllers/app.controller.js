(function() {
	'use strict';

	function controller($rootScope, $scope, $state) {
		// TODO register for state changes and change the title
		// $rootScope.currTitle = $state.current.title;
		// $rootScope.pageTitle = function() {
		// 	return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
		// };
		$rootScope.pageTitle = function() {
			return $rootScope.app.name + ' - ' + $rootScope.app.description;
		};
	}

	controller.$inject = ['$rootScope', '$scope', '$state'];

	angular.module('fmCore').controller('AppController', controller);
})();
