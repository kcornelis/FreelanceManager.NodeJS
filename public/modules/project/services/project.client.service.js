'use strict';

angular.module('project').factory('Project', ['$resource', function($resource) {
	return $resource('/api/public/projects/:id', { id: '@id' }); 
}]);