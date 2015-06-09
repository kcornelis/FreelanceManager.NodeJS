// TODO unit test
(function() {
	'use strict';

	function iframeDirective($compile) {
		return {
			restrict: 'A',
			link: function (scope, ele, attrs) {
				scope.$watch(attrs.fmIframe, function(html) {
					var compiled = $compile(angular.element('<div data-fm-with=\'' + attrs.fmIframeBind + '\'>' + html + '</div>'))(scope);
					$(ele[0].contentDocument.body).html(compiled);
				});
			}
		};
	}
	
	iframeDirective.$inject = ['$compile'];

	angular.module('core').directive('fmIframe', iframeDirective);
})();
