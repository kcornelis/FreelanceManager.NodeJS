(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.invoice_create', {
			url: '/invoice/create',
			templateUrl: 'modules/invoice/views/create.html',
			controller: 'CreateInvoiceController'
		})

		.state('app.invoice_overview', {
			url: '/invoice/overview/:from/:to',
			templateUrl: 'modules/invoice/views/overview.html',
			controller: 'InvoiceOverviewController',
			params: {
				from: function() { return moment().startOf('year').format('YYYYMMDD'); },
				to: function() { return moment().endOf('year').format('YYYYMMDD'); }
			}
		})

		.state('app.invoice_report', {
			url: '/invoice/report/:from/:to',
			templateUrl: 'modules/invoice/views/report.html',
			controller: 'InvoiceReportController',
			resolve: fm.vendor.resolve('flot', 'flot-plugins'),
			params: {
				from: function() { return moment().startOf('year').format('YYYYMMDD'); },
				to: function() { return moment().endOf('year').format('YYYYMMDD'); }
			}
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmInvoice').config(routeRegistration);
})();
