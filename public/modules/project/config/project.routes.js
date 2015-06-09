(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.projects', {
			url: '/projects/overview',
			templateUrl: 'modules/project/views/projects.html',
			controller: 'ProjectsController',
            access: { requiredLogin: true }
		});
	}

	routeRegistration.$inect = ['$stateProvider'];

	angular.module('project').config(routeRegistration);
})();
