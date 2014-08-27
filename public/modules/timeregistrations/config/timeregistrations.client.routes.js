'use strict';

// Setting up route
angular.module('timeregistrations').config(['$stateProvider',
	function($stateProvider) {
		// TimeRegistrations state routing
		$stateProvider.
		state('listTimeRegistrations', {
			url: '/timeregistrations',
			templateUrl: 'modules/timeregistrations/views/list-timeregistrations.client.view.html'
		}).
		state('createTimeRegistrations', {
			url: '/timeregistrations/create',
			templateUrl: 'modules/timeregistrations/views/create-timeregistration.client.view.html'
		}).
		state('viewTimeRegistrations', {
			url: '/timeregistrations/:timeRegistrationId',
			templateUrl: 'modules/timeregistrations/views/view-timeregistration.client.view.html'
		}).
		state('editTimeRegistrations', {
			url: '/timeregistrations/:timeRegistrationId/edit',
			templateUrl: 'modules/timeregistrations/views/edit-timeregistration.client.view.html'
		});
	}
]);
