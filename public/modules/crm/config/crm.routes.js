angular.module('crm').config(['$stateProvider',
	function($stateProvider) {
		'use strict';
		
		$stateProvider

		.state('app.companies', {
			url: '/crm/companies',
			templateUrl: 'modules/crm/views/companies.html',
			controller: 'CompaniesController',
			access: { requiredLogin: true }
		});
	}
]);