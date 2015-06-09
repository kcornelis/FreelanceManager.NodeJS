// TODO unit test
(function() {
	'use strict';

	function dynamicDirective($compile) {
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
	}
	
	dynamicDirective.$inject = ['$compile'];

	angular.module('core').directive('fmDynamic', dynamicDirective);
})();
