'use strict';

// Setting up route
angular.module('time').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		// time registration state routing
		$stateProvider
		.state('time', {
			templateUrl: 'modules/time/views/timeregistration.client.view.html',
            access: { requiredLogin: true }
		})
		.state('time.timeregistrations', {
			url: '/time/:date',
			templateUrl: 'modules/time/views/timeregistrations.client.view.html',
            access: { requiredLogin: true }
		});
	}
]);