(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.settings_templates', {
			url: '/settings/templates',
			templateUrl: 'modules/settings/views/templates.html',
			controller: 'TemplatesController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmSettings').config(routeRegistration);
})();
