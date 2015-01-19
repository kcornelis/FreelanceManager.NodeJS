'use strict';

angular.module('core').factory('Invoice', ['$resource', function($resource) {
	return $resource('/api/public/invoices/:id', { id: '@id' }); 
}]);