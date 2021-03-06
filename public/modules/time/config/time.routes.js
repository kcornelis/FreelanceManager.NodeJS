(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.time_overview', {
			url: '/time/overview/:date',
			templateUrl: 'modules/time/views/overview.html',
			controller: 'TimeRegistrationOverviewController',
			params: {
				date: function() { return moment().format('YYYYMMDD'); }
			}
		})

		.state('app.time_report', {
			url: '/time/report/:from/:to',
			templateUrl: 'modules/time/views/report.html',
			controller: 'TimeRegistrationReportController',
			resolve: fm.vendor.resolve('flot', 'flot-plugins'),
			params: {
				from: function() { return moment().startOf('month').format('YYYYMMDD'); },
				to: function() { return moment().endOf('month').format('YYYYMMDD'); }
			}
		})

		.state('app.time_import', {
			url: '/time/import',
			templateUrl: 'modules/time/views/import.html',
			controller: 'TimeRegistrationImportController',
			resolve: fm.vendor.resolve('xlsx')
		})

		.state('app.time_export', {
			url: '/time/export/:from/:to',
			templateUrl: 'modules/time/views/export.html',
			controller: 'TimeRegistrationExportController',
			params: {
				from: function() { return moment().startOf('month').format('YYYYMMDD'); },
				to: function() { return moment().endOf('month').format('YYYYMMDD'); }
			}
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmTime').config(routeRegistration);
})();
