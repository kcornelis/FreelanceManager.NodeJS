(function() {
	'use strict';

	function autofocusDirective($timeout, $parse) {
		return {
			link: function(scope, element, attrs) {
				if(attrs.autofocusCondition) {
					 scope.$watch(
						function () { return $parse(attrs.autofocusCondition)(); },
						function (newVal) { 
							if(newVal) { 
								$timeout(function() {
									element[0].focus(); 
								}, 100);
							}
						}
					);
				} else {
					$timeout(function() {
						element[0].focus(); 
					}, 100);
				}
			}
		};
	}
	
	autofocusDirective.$inject = ['$timeout', '$parse'];

	angular.module('fmCore').directive('autofocus', autofocusDirective);
})();
