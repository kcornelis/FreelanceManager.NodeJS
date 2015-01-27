'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider', 'APP_REQUIRES',
	function($stateProvider, $urlRouterProvider, appRequires) {
		
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/app/dashboard');

		// Home state routing
		$stateProvider
		.state('app', {
			url: '/app',
			abstract: true,
			templateUrl: 'modules/core/views/app.html',
			controller: 'AppController',
			resolve: ApplicationConfiguration.resolve('fastclick', 'modernizr', 'icons', 'screenfull', 'animo', 'sparklines', 'slimscroll', 'classyloader', 'toaster', 'whirl'),
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
