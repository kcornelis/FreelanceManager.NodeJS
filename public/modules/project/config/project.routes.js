(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.projects', {
			url: '/projects/overview',
			templateUrl: 'modules/project/views/projects.html',
			controller: 'ProjectsController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmProject').config(routeRegistration);
})();
