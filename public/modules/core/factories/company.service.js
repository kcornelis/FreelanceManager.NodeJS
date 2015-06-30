(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/companies/:id', { id: '@id' }); 
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Company', factory);
})();
