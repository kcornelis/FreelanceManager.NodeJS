'use strict';

angular.module('project').factory('Company', ['$resource', function($resource) {
	return $resource('/api/public/companies/:id', { id: '@id' }); 
}]);