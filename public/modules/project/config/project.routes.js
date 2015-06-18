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

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmProject').config(routeRegistration);
})();
