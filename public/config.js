var fm = fm || {};

fm.config = (function() {
	'use strict';

	return {
		moduleName: 'freelancemanager',
		moduleDependencies: ['LocalStorageModule', 
			'ngAnimate', 
			'ui.bootstrap', 
			'ui.router', 
			'ui.utils',
			'oc.lazyLoad',
			'ngResource', 
			'ft', 
			'ngTable',
			'localytics.directives',
			'angular-loading-bar']
	};
})();
