(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.invoice_create', {
			url: '/invoice/create',
			templateUrl: 'modules/invoice/views/create.html',
			controller: 'CreateController',
			access: { requiredLogin: true }
		})

		.state('app.invoice_overview', {
			url: '/invoice/overview/:from/:to',
			templateUrl: 'modules/invoice/views/overview.html',
			controller: 'InvoiceOverviewController',
			access: { requiredLogin: true },
			params: {
				from: function(){ return moment().startOf('year').format('YYYYMMDD'); },
				to: function(){ return moment().endOf('year').format('YYYYMMDD'); }
			}
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('invoice').config(routeRegistration);
})();
