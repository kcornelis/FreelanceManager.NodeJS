'use strict';

angular.module('core').factory('Account', ['$resource', function($resource) {
	return $resource('/api/public/accounts/:id', { id: '@id' }); 
}]);