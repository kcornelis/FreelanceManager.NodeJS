'use strict';

// Setting up route
angular.module('time').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		// time registration state routing
		$stateProvider
		.state('time', {
			templateUrl: 'modules/time/views/timeregistration.html',
			access: { requiredLogin: true }
		})
		.state('time.overview', {
			url: '/time/overview',
			templateUrl: 'modules/time/views/overview.html',
			access: { requiredLogin: true }
		})
		.state('time.registrations', {
			templateUrl: 'modules/time/views/registrations.html',
			access: { requiredLogin: true }
		})
		.state('time.registrations.list', {
			url: '/time/:date',
			templateUrl: 'modules/time/views/registrations.list.html',
			access: { requiredLogin: true }
		});
	}
]);