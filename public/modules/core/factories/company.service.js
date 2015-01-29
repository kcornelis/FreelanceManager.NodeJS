angular.module('core').factory('Company', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/companies/:id', { id: '@id' }); 
}]);