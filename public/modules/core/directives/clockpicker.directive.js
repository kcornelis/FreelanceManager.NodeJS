angular.module('core').directive('fmClockpicker', 
function () {
	'use strict';

	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.clockpicker();
		}
	};
});