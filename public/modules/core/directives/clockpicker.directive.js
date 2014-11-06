'use strict';

angular.module('core').directive('fmClockpicker', function () {
	return {
		restrict: 'A',
		 link: function (scope, element, attrs) {
			element.clockpicker();
		}
	};
});