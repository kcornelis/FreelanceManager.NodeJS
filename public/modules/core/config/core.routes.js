angular.module('core').config(['$stateProvider', '$urlRouterProvider', 'APP_REQUIRES',
function($stateProvider, $urlRouterProvider, appRequires) {
		'use strict';
		
		// Redirect to the dashboard view when route not found
		$urlRouterProvider.otherwise('/app/dashboard');

		$stateProvider

		.state('app', {
			url: '/app',
			abstract: true,
			templateUrl: 'modules/core/views/app.html',
			controller: 'AppController',
			access: { requiredLogin: true }
		})

		.state('app.dashboard', {
			url: '/dashboard',
			title: 'Dashboard',
			templateUrl: 'modules/core/views/dashboard.html',
			access: { requiredLogin: true }
		});
	}
]);
