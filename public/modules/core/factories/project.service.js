'use strict';

angular.module('core').factory('Project', ['$resource', function($resource) {
	return $resource('/api/public/projects/:id', { id: '@id' },
	{ 
		active: { method:'GET', url: '/api/public/projects/active', isArray: true },
		hide: { method:'POST', url: '/api/public/projects/:id/hide', isArray: false },
		unhide: { method:'POST', url: '/api/public/projects/:id/unhide', isArray: false },
		changetasks: { method:'POST', url: '/api/public/projects/:id/changetasks', isArray: false }
	}); 
}]);