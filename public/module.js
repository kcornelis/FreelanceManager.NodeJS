var fm = fm || {};

fm.module = (function() {
	'use strict';

	function register(moduleName) {
		var m = angular.module(moduleName, []);

		// Add the module to the AngularJS configuration file
		angular.module(fm.config.moduleName).requires.push(moduleName);

		return m;
	};

	return {
		register: register
	};
})();
