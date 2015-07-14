(function() {
	'use strict';

	function controller($rootScope, $scope, $state, cfpLoadingBar) {
		// TODO register for state changes and change the title
		// $rootScope.currTitle = $state.current.title;
		// $rootScope.pageTitle = function() {
		// 	return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
		// };
		$rootScope.pageTitle = function() {
			return $rootScope.app.name + ' - ' + $rootScope.app.description;
		};

		// TODO unit test
		$rootScope.$on('$stateChangeStart', function() {
			cfpLoadingBar.start();
		});

		$rootScope.$on('$stateChangeSuccess', function(event) {
			event.targetScope.$watch('$viewContentLoaded', function () {
				cfpLoadingBar.complete();
			});
		});
	}

	controller.$inject = ['$rootScope', '$scope', '$state', 'cfpLoadingBar'];

	angular.module('fmCore').controller('AppController', controller);
})();
