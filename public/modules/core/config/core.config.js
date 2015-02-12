angular.module('core')

.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
	'use strict';

	cfpLoadingBarProvider.includeBar = true;
	cfpLoadingBarProvider.includeSpinner = false;
	cfpLoadingBarProvider.latencyThreshold = 500;
	cfpLoadingBarProvider.parentSelector = '.wrapper > section';
}])

.controller('NullController', function() {})

.run(['$rootScope', '$state', '$stateParams',  '$window', '$templateCache', function ($rootScope, $state, $stateParams, $window, $templateCache) {
	'use strict';

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
		year: ((new Date()).getFullYear()),
		layout: {
			isFixed: true,
			isCollapsed: false,
			isBoxed: false,
			isRTL: false
		},
		viewAnimation: 'ng-fadeInUp'
	};
}]);