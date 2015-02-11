angular.module('time').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		'use strict';

		$stateProvider

		.state('app.time_overview', {
			url: '/time/overview/:date',
			templateUrl: 'modules/time/views/overview.html',
			controller: 'OverviewController',
			access: { requiredLogin: true },
			params: {
				date: function(){ return new moment().format('YYYYMMDD'); }
			}
		})

		.state('app.time_report', {
			url: '/time/report/:from/:to',
			templateUrl: 'modules/time/views/report.html',
			controller: 'ReportController',
			access: { requiredLogin: true },
			params: {
				from: function(){ return new moment().startOf('month').format('YYYYMMDD'); },
				to: function(){ return new moment().endOf('month').format('YYYYMMDD'); }
			}
		})

		.state('app.time_import', {
			url: '/time/import',
			templateUrl: 'modules/time/views/import.html',
			controller: 'ImportController',
			resolve: ApplicationConfiguration.resolve('lib/js-xlsx/dist/xlsx.core.min.js'),
			access: { requiredLogin: true }
		})

		.state('app.time_export', {
			url: '/time/export/:from/:to',
			templateUrl: 'modules/time/views/export.html',
			controller: 'ExportController',
			access: { requiredLogin: true },
			params: {
				from: function(){ return new moment().startOf('month').format('YYYYMMDD'); },
				to: function(){ return new moment().endOf('month').format('YYYYMMDD'); }
			}
		});
	}
]);