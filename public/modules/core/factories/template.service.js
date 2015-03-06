angular.module('core').factory('Template', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/templates/:id', { id: '@id' },
	{ 
		active: { method:'GET', url: '/api/public/templates/active', isArray: true },
		hide: { method:'POST', url: '/api/public/templates/:id/hide', isArray: false },
		unhide: { method:'POST', url: '/api/public/templates/:id/unhide', isArray: false }
	}); 
}]);