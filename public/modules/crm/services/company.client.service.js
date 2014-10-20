'use strict';

angular.module('crm').factory('Company', ['$resource', function($resource) {
	return $resource('/api/public/companies/:id', { id: '@id' }); 
}]);