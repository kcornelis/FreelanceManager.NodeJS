angular.module('core').directive('autofocus', 
function($timeout) {
	'use strict';

	return {
		link: function(scope, element, attrs) {
			$timeout(function() {
				element[0].focus(); 
			}, 100);
		}
	};
});