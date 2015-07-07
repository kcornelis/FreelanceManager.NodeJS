(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.companies', {
			url: '/crm/companies',
			templateUrl: 'modules/crm/views/companies.html',
			controller: 'CompaniesController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmCrm').config(routeRegistration);
})();
