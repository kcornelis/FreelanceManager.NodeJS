// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	'use strict';

	// Init module configuration options
	var applicationModuleName = 'freelancemanager';
	var applicationModuleVendorDependencies = ['ngRoute', 'ngAnimate', 'ngStorage', 'ngCookies', 'pascalprecht.translate', 'ui.bootstrap', 'ui.router', 'ui.utils', 'oc.lazyLoad', 'cfp.loadingBar', 'ngSanitize', 'ngResource'];

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
			deps: ['$ocLazyLoad','$q', 'APP_REQUIRES', function ($ocLL, $q, appRequires) {
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
								// if is a module, pass the name. If not, pass the array
								var whatToLoad = getRequired(_arg);
								// simple error check
								if(!whatToLoad) return $.error('Route resolve: Bad resource name [' + _arg + ']');
								// finally, return a promise
								return $ocLL.load( whatToLoad );
							});
				}
				// check and returns required data
				// analyze module items with the form [name: '', files: []]
				// and also simple array of script files (for not angular js)
				function getRequired(name) {
					if (appRequires.modules)
							for(var m in appRequires.modules)
									if(appRequires.modules[m].name && appRequires.modules[m].name === name)
											return appRequires.modules[m];
					return appRequires.scripts && appRequires.scripts[name];
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