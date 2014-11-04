'use strict';

angular.module('core').factory('TimeRegistration', ['$resource', function($resource) {
	return $resource('/api/public/timeregistrations/:id', { id: '@id' },
	{ 
		bydate: { method:'GET', url: '/api/public/timeregistrations/bydate/:date', params: { date: '@date' }, isArray: true } 
	}); 
}]);