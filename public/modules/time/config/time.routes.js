'use strict';

// Setting up route
angular.module('time').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		// time registration state routing
		$stateProvider
		
		.state('time', {
			templateUrl: 'modules/time/views/time.html',
			access: { requiredLogin: true }
		})

		.state('time.overview', {
			url: '/time/overview/:from/:to',
			templateUrl: 'modules/time/views/overview.html',
			access: { requiredLogin: true },
			resolve: ApplicationConfiguration.resolve('datetime')
		})

		.state('time.registrations', {
			url: '/time/registrations/:date',
			templateUrl: 'modules/time/views/registrations.html',
			access: { requiredLogin: true },
			resolve: ApplicationConfiguration.resolve('datetime')
		})

		.state('time.report', {
			url: '/time/report/:from/:to',
			templateUrl: 'modules/time/views/report.html',
			access: { requiredLogin: true },
			resolve: ApplicationConfiguration.resolve('flot-charts', 'flot-charts-plugins')
		})

		.state('time.import', {
			url: '/time/import',
			templateUrl: 'modules/time/views/import.html',
			access: { requiredLogin: true }
		});
	}
]);