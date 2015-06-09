(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.companies', {
			url: '/crm/companies',
			templateUrl: 'modules/crm/views/companies.html',
			controller: 'CompaniesController',
			access: { requiredLogin: true }
		});
	}

	routeRegistration.$inect = ['$stateProvider'];

	angular.module('crm').config(routeRegistration);
})();
