var fm = fm || {};

fm.vendor = (function() {
	'use strict';

	var vendorConfiguration = [
	{
		name: 'flot',
		files: ['lib/flot/jquery.flot.js']
	}, 
	{
		name: 'flot-plugins',
		files: ['lib/flot/jquery.flot.resize.js',
			'lib/flot/jquery.flot.pie.js', 
			'lib/flot/jquery.flot.time.js',
			'lib/flot/jquery.flot.categories.js', 
			'lib/flot/jquery.flot.stack.js',
			'lib/flot-spline/js/jquery.flot.spline.js', 
			'lib/flot.tooltip/js/jquery.flot.tooltip.js',
			'lib/angular-flot/angular-flot.js']
	}, 
	{
		name: 'xlsx',
		files: ['lib/js-xlsx/dist/xlsx.core.min.js']
	}];

	function configure($ocLazyLoadProvider) {
		$ocLazyLoadProvider.config({
			modules: vendorConfiguration
		});
	}

	configure.$inject = ['$ocLazyLoadProvider'];

	angular.module(fm.config.moduleName).config(configure);

	function resolve() {
		var _args = arguments;
		return {
			vendor: ['$ocLazyLoad','$q', function ($ocLL, $q) {
				// Creates a promise chain for each argument
				var promise = $q.when(1); // empty promise
				for(var i=0, len=_args.length; i < len; i ++) {

					promise = andThen(_args[i]);
				}
				return promise;

				// creates promise to chain dynamically
				function andThen(_arg) {
					// also support a function that returns a promise
					if(typeof _arg == 'function')
						return promise.then(_arg);
					else return promise.then(function() {
						return $ocLL.load( _arg );
					});
				}
			}]};
	};

	return {
		resolve: resolve
	};

})();

(function() {
	'use strict';

	var ftApp = angular.module('ftApp', ['ui.router', 'ngAnimate', 'oc.lazyLoad', 'ft', 'LocalStorageModule', 'angular-loading-bar']);
	ftApp.config(configureRouting);
	ftApp.config(configureLoadingBarProvider);
	ftApp.run(configureLoadingBar);

	configureRouting.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', '$ocLazyLoadProvider'];
	configureLoadingBar.$inject = ['$rootScope', 'cfpLoadingBar'];
	configureLoadingBarProvider.$inject = ['cfpLoadingBarProvider'];

	function configureLoadingBarProvider(cfpLoadingBarProvider) {
		cfpLoadingBarProvider.parentSelector = '#content';
		cfpLoadingBarProvider.includeSpinner = false;
		cfpLoadingBarProvider.includeBar = true;
	}

	function configureLoadingBar($rootScope, cfpLoadingBar) {

		$rootScope.$on('$stateChangeStart', function() {
			cfpLoadingBar.start();
		});

		$rootScope.$on('$stateChangeSuccess', function(event) {
			event.targetScope.$watch('$viewContentLoaded', function () {
				cfpLoadingBar.complete();
			});
		});
	}

	function configureRouting($stateProvider, $urlRouterProvider, $locationProvider, $ocLazyLoadProvider) {
		
		$urlRouterProvider.otherwise('dashboard');

		$ocLazyLoadProvider.config({
			modules: [{
				name: 'chosen',
				insertBefore: '#flatThemeCss',
				files: [ '../../vendor/chosen/chosen.min.css', '../../vendor/chosen/chosen.jquery.min.js', '../../vendor/angular-bootstrap-chosen/dist/js/chosen.js' ]
			}, {
				name: 'flot',
				files: [ '../../vendor/flot/jquery.flot.js', '../../vendor/flot/jquery.flot.resize.js' ]
			}, {
				name: 'flot-plugins',
				files: [ '../../vendor/flot/jquery.flot.pie.js', '../../vendor/flot/jquery.flot.time.js',
					'../../vendor/flot/jquery.flot.categories.js', '../../vendor/flot/jquery.flot.stack.js',
					'../../vendor/flot-spline/jquery.flot.spline.js', '../../vendor/flot.tooltip/jquery.flot.tooltip.js',
					'../../vendor/angular-flot/angular-flot.js' ]
			}]
		});

		var states = [

			{ name: 'dashboard' },

			{ name: 'elements-buttons' },
			{ name: 'elements-notifications' },
			{ name: 'elements-panels' },
			{ name: 'elements-tables' },
			{ name: 'elements-tools' },
			{ name: 'elements-typography' },

			{ name: 'forms-standard' },
			{ name: 'forms-advanced', vendor: [ 'chosen' ] },
			{ name: 'forms-wizard' },

			{ name: 'charts-flot', vendor: [ 'flot', 'flot-plugins' ] },

			{ name: 'pages-blank' },
			{ name: 'pages-login' }
		];


		for (var i = 0; i < states.length; i++) {
			var state = states[i].name;
			var vendor = states[i].vendor;

			var options = {
				url: '/' + state,
				templateUrl: 'views/' + state + '.html'
			}

			if(vendor) {
				options.resolve = vendorResolve(vendor);
			}

			$stateProvider.state(state, options);
		}
	}

	function vendorResolve() {
		var vendorResolveArguments = arguments;
		return {
			deps: ['$ocLazyLoad', '$q', function ($ocLL, $q) {

				var promise = $q.when(1);
				for(var i = 0; i < vendorResolveArguments.length; i++){
					if($.isArray(vendorResolveArguments[i])) {
						for(var j = 0; j < vendorResolveArguments[i].length; j++){
							promise = andThen(vendorResolveArguments[i][j]);
						}
					} else {
						promise = andThen(vendorResolveArguments[i]);
					}
				}

				return promise;

				function andThen(m) {
					if(typeof m == 'function') return promise.then(m);
					else return promise.then(function() { return $ocLL.load(m); });
				}
			}]
		};
	}
})();

