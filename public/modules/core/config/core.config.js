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

	function configureLoadingBarProvider(cfpLoadingBarProvider) {
		cfpLoadingBarProvider.parentSelector = '#content';
		cfpLoadingBarProvider.includeSpinner = false;
		cfpLoadingBarProvider.includeBar = true;
		cfpLoadingBarProvider.latencyThreshold = 500;
	}

	config.$inject = ['$rootScope', '$state', '$stateParams',  '$window'];
	configureLoadingBarProvider.$inject = ['cfpLoadingBarProvider'];

	angular.module('fmCore').run(config);
	angular.module('fmCore').config(configureLoadingBarProvider);
})();
