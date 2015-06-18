(function() {
	'use strict';

	function factory(ngTableParams) {
		return ngTableParams;
	}

	factory.$inject = ['ngTableParams'];

	angular.module('fmCore').factory('NgTableParams', factory);
})();
