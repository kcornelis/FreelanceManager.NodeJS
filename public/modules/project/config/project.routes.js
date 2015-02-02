angular.module('project').config(['$stateProvider',
	function($stateProvider) {
		'use strict';

		$stateProvider

		.state('app.projects', {
			url: '/projects/overview',
			templateUrl: 'modules/project/views/projects.html',
			controller: 'ProjectsController',
            access: { requiredLogin: true }
		});
	}
]);