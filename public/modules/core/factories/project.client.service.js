'use strict';

angular.module('core').factory('Project', ['$resource', function($resource) {
	return $resource('/api/public/projects/:id', { id: '@id' },
	{ 
		active: { method:'GET', url: '/api/public/projects/active', isArray: true } 
	}); 
}]);