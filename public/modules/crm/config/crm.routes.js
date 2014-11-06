'use strict';

// Setting up route
angular.module('crm').config(['$stateProvider',
	function($stateProvider) {
		// crm state routing
		$stateProvider
		.state('crm', {
			templateUrl: 'modules/crm/views/crm.html',
            access: { requiredLogin: true }
		})
		.state('crm.companies', {
			url: '/companies',
			templateUrl: 'modules/crm/views/companies.html',
            access: { requiredLogin: true }
		});
	}
]);