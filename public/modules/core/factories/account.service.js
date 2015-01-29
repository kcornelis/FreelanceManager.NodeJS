angular.module('core').factory('Account', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/accounts/:id', { id: '@id' }); 
}]);