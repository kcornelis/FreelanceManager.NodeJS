'use strict';

// Setting up route
angular.module('config').config(['$stateProvider',
	function($stateProvider) {
		// Config state routing
		$stateProvider
		.state('config', {
			templateUrl: 'modules/config/views/config.client.view.html',
            access: { requiredLogin: true }
		})
		.state('config.clients', {
			url: '/config/clients',
			templateUrl: 'modules/config/views/clients.client.view.html',
            access: { requiredLogin: true }
		})
	}
]);
