(function() {
	'use strict';

	function autofocusDirective($timeout) {
		return {
			link: function(scope, element, attrs) {
				$timeout(function() {
					element[0].focus(); 
				}, 100);
			}
		};
	}
	
	autofocusDirective.$inject = [];

	angular.module('core').directive('autofocus', autofocusDirective);
})();
