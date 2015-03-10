// TODO unit test
angular.module('core').directive('fmDynamic', 
function ($compile) {
	'use strict';
	
	return {
		restrict: 'A',
		replace: true,
		link: function (scope, ele, attrs) {
			scope.$watch(attrs.fmDynamic, function(html) {
				ele.html('<div data-fm-with=\'' + attrs.fmDynamicBind + '\'>' + html + '</div>');
				$compile(ele.contents())(scope);
			});
		}
	};
});