'use strict';

angular.module('core').factory('Project', ['$resource', function($resource) {
	return $resource('/api/public/projects/:id', { id: '@id' }); 
}]);