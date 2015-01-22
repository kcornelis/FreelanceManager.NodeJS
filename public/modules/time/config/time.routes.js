'use strict';

// Setting up route
angular.module('time').config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider',
	function($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {

		 $ocLazyLoadProvider.config({
		    debug: false,
		    events: true
		  });

		// time registration state routing
		$stateProvider
		
		.state('time', {
			templateUrl: 'modules/time/views/time.html',
			access: { requiredLogin: true }
		})

		.state('time.overview', {
			url: '/time/overview/:from/:to',
			templateUrl: 'modules/time/views/overview.html',
			access: { requiredLogin: true },
        	resolve: resolveFor('datetime')
		})

		.state('time.registrations', {
			url: '/time/registrations/:date',
			templateUrl: 'modules/time/views/registrations.html',
			access: { requiredLogin: true },
        	resolve: resolveFor('datetime')
		})

		.state('time.report', {
			url: '/time/report/:from/:to',
			templateUrl: 'modules/time/views/report.html',
			access: { requiredLogin: true },
        	resolve: resolveFor('flot', 'flot-plugins')
		})

		.state('time.import', {
			url: '/time/import',
			templateUrl: 'modules/time/views/import.html',
			access: { requiredLogin: true }
		});


		// Generates a resolve object by passing script names
    // previously configured in constant.APP_REQUIRES
    function resolveFor() {
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
            return ApplicationConfiguration.scripts && ApplicationConfiguration.scripts[name];
          }

        }]};
    }
	}
]);