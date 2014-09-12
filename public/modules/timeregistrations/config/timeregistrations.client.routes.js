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
			templateUrl: 'modules/timeregistrations/views/timeregistrations-list.client.view.html'
		})
		.state('timeregistrations.create', {
			url: '/timeregistrations/create',
			templateUrl: 'modules/timeregistrations/views/timeregistrations-create.client.view.html'
		})
		.state('timeregistrations.view', {
			url: '/timeregistrations/:timeRegistrationId',
			templateUrl: 'modules/timeregistrations/views/timeregistrations-view.client.view.html'
		})
		.state('timeregistrations.edit', {
			url: '/timeregistrations/:timeRegistrationId/edit',
			templateUrl: 'modules/timeregistrations/views/timeregistrations-edit.client.view.html'
		});
	}
]);