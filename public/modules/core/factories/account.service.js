angular.module('core').factory('Account', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/accounts/:id', { id: '@id' },
	{ 
		changePassword: { method:'POST', url: '/api/public/accounts/:id/changepassword', params: { id: '@id' } }
	}); 
}]);