'use strict';

// Setting up route
angular.module('crm').config(['$stateProvider',
	function($stateProvider) {
		// crm state routing
		$stateProvider
		.state('crm', {
			templateUrl: 'modules/crm/views/crm.client.view.html',
            access: { requiredLogin: true }
		})
		.state('crm.companies', {
			url: '/companies',
			templateUrl: 'modules/crm/views/companies.client.view.html',
            access: { requiredLogin: true }
		});
	}
]);