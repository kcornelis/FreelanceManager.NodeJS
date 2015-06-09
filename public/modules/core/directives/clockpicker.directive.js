(function() {
	'use strict';

	function clockpickerDirective() {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				element.clockpicker();
			}
		};
	}
	
	clockpickerDirective.$inject = [];

	angular.module('core').directive('fmClockpicker', clockpickerDirective);
})();
