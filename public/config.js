// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	'use strict';

	// Init module configuration options
	var applicationModuleName = 'freelancemanager';
	var applicationModuleVendorDependencies = ['ngRoute', 'LocalStorageModule', 'ngAnimate', 'localytics.directives', 'ngStorage', 'ngCookies', 'ui.bootstrap', 'ui.router', 'ui.utils', 'oc.lazyLoad', 'cfp.loadingBar', 'ngSanitize', 'ngResource', 'ngTable', 'ft'];

	// Add a new vertical module
	var registerModule = function(moduleName) {

		// Create angular module
		var m = angular.module(moduleName, []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);

		return m;
	};

	var resolve = function() {
		var _args = arguments;
		return {
			deps: ['$ocLazyLoad','$q', function ($ocLL, $q) {
				// Creates a promise chain for each argument
				var promise = $q.when(1); // empty promise
				for(var i=0, len=_args.length; i < len; i ++){
					promise = andThen(_args[i]);
				}
				return promise;

				// creates promise to chain dynamically
				function andThen(_arg) {
					// also support a function that returns a promise
					if(typeof _arg == 'function')
							return promise.then(_arg);
					else
							return promise.then(function() {
								return $ocLL.load( _arg );
							});
				}
			}]};
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule,
		resolve: resolve
	};
})();