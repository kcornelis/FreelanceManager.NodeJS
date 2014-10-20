'use strict';

// Setting up route
angular.module('project').config(['$stateProvider',
	function($stateProvider) {
		// project state routing
		$stateProvider
		.state('project', {
			templateUrl: 'modules/project/views/project.client.view.html',
            access: { requiredLogin: true }
		})
		.state('project.projects', {
			url: '/projects',
			templateUrl: 'modules/project/views/projects.client.view.html',
            access: { requiredLogin: true }
		});
	}
]);