(function() {
	'use strict';
	
	angular.module(fm.config.moduleName, fm.config.moduleDependencies);

	// Setting HTML5 Location Mode
	angular.module(fm.config.moduleName).config(['$locationProvider',
		function($locationProvider) {
			$locationProvider.hashPrefix('!');
		}
	]);

	angular.element(document).ready(function() {
		angular.bootstrap(document, [fm.config.moduleName]);
	});
})();
