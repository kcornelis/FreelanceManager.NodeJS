'use strict';

// Setting up route
angular.module('project').config(['$stateProvider',
	function($stateProvider) {
		// project state routing
		$stateProvider
		.state('project', {
			templateUrl: 'modules/project/views/project.html',
            access: { requiredLogin: true }
		})
		.state('project.projects', {
			url: '/projects',
			templateUrl: 'modules/project/views/projects.html',
            access: { requiredLogin: true }
		});
	}
]);