'use strict';

angular.module('core').factory('Company', ['$resource', function($resource) {
	return $resource('/api/public/companies/:id', { id: '@id' }); 
}]);