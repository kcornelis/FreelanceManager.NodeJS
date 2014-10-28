'use strict';

angular.module('core').factory('TimeRegistration', ['$resource', function($resource) {
	return $resource('/api/public/timeregistrations/:id', { id: '@id' }); 
}]);