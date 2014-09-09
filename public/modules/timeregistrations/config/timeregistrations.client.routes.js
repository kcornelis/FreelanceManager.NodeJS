'use strict';

// Setting up route
angular.module('timeregistrations').config(['$stateProvider',
	function($stateProvider) {
		// TimeRegistrations state routing
		$stateProvider
		.state('timeregistrations', {
			templateUrl: 'modules/timeregistrations/views/timeregistrations.client.view.html'
		})
		.state('timeregistrations.list', {
			url: '/timeregistrations',
			templateUrl: 'modules/timeregistrations/views/list-timeregistrations.client.view.html'
		})
		.state('timeregistrations.create', {
			url: '/timeregistrations/create',
			templateUrl: 'modules/timeregistrations/views/create-timeregistration.client.view.html'
		})
		.state('timeregistrations.view', {
			url: '/timeregistrations/:timeRegistrationId',
			templateUrl: 'modules/timeregistrations/views/view-timeregistration.client.view.html'
		})
		.state('timeregistrations.edit', {
			url: '/timeregistrations/:timeRegistrationId/edit',
			templateUrl: 'modules/timeregistrations/views/edit-timeregistration.client.view.html'
		});
	}
]);
