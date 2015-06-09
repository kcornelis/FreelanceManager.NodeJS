(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/companies/:id', { id: '@id' }); 
	}

	factory.$inject = ['$resource'];

	angular.module('core').factory('Company', factory);
})();
