'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'freelancemanager';
	var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ui.router', 'ui.bootstrap', 'ui.utils', 'oc.lazyLoad'];

	// Add a new vertical module
	var registerModule = function(moduleName) {
		// Create angular module
		angular.module(moduleName, []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	var scripts = {
		'flot': [
			'lib/flot/jquery.flot.js'
		],
		'flot-plugins': [
			'lib/flot/jquery.flot.resize.js',
			'lib/flot/jquery.flot.pie.js'
		],
		'datetime': [
			'lib/clockpicker/dist/bootstrap-clockpicker.css',
			'lib/bootstrap-datepicker/css/datepicker3.css',
			'lib/clockpicker/dist/bootstrap-clockpicker.js',
			'lib/bootstrap-datepicker/js/bootstrap-datepicker.js'
		]
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule,
		scripts: scripts
	};
})();
