(function() {
	'use strict';

	function config($rootScope, $state, $stateParams, $window) {

		// Set reference to access them from any scope
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		$rootScope.$storage = $window.localStorage;

		// Scope Globals
		// ----------------------------------- 
		$rootScope.app = {
			name: 'Freelance Manager',
			description: 'A demo application in NodeJS',
			author: 'Kevin Cornelis',
			year: ((new Date()).getFullYear())
		};
	}

	config.$inject = ['$rootScope', '$state', '$stateParams',  '$window'];

	angular.module('fmCore').run(config);
})();
