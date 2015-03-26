angular.module('core').factory('Invoice', ['$resource', 
function($resource) {
	'use strict';
	
	return $resource('/api/public/invoices/:id', { id: '@id' },
	{ 
		preview: { method:'POST', url: '/api/public/invoices/preview', isArray: false },
		bydate: { method:'GET', url: '/api/public/invoices/bydate/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
	}); 
}]);