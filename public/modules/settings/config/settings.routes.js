(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.settings_templates', {
			url: '/settings/templates',
			templateUrl: 'modules/settings/views/templates.html',
			controller: 'TemplatesController',
            access: { requiredLogin: true }
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('settings').config(routeRegistration);
})();
