(function() {
	'use strict';

	function momentFilter() {
		return function(date, format){
			return date.format(format);
		};
	}	
	
	momentFilter.$inject = [];

	angular.module('core').filter('moment', momentFilter);
})();
