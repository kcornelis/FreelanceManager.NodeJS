angular.module('core')

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
		year: ((new Date()).getFullYear())
	};
}]);