angular.module('settings').config(['$stateProvider',
	function($stateProvider) {
		'use strict';

		$stateProvider

		.state('app.settings_templates', {
			url: '/settings/templates',
			templateUrl: 'modules/settings/views/templates.html',
			controller: 'TemplatesController',
            access: { requiredLogin: true }
		});
	}
]);