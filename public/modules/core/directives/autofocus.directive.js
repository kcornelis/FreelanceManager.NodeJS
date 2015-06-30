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
	
	autofocusDirective.$inject = ['$timeout'];

	angular.module('fmCore').directive('autofocus', autofocusDirective);
})();
