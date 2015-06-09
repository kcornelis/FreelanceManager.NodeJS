(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/accounts/:id', { id: '@id' },
		{ 
			changePassword: { method:'POST', url: '/api/public/accounts/:id/changepassword', params: { id: '@id' } }
		}); 
	}

	factory.$inject = ['$resource'];

	angular.module('core').factory('Account', factory);
})();
