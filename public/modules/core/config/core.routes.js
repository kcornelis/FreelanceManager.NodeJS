(function() {
	'use strict';
	
	function routeRegistration($stateProvider, $urlRouterProvider) {

		$stateProvider

		.state('app', {
			url: '/app',
			abstract: true,
			templateUrl: 'modules/core/views/app.html',
			controller: 'AppController'
		})

		.state('app.dashboard', {
			url: '/dashboard',
			title: 'Dashboard',
			templateUrl: 'modules/core/views/dashboard.html'
		});

		// Redirect to the dashboard view when route not found
		$urlRouterProvider.otherwise( function($injector, $location) {
			var $state = $injector.get('$state');
			$state.go('app.dashboard');
		});
	}

	routeRegistration.$inject = ['$stateProvider', '$urlRouterProvider'];

	angular.module('fmCore').config(routeRegistration);
})();
