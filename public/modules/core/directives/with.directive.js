// TODO unit test
(function() {
	'use strict';

	function withDirective() {
		function controller($scope, $attrs, $parse) {
			$scope.$parent.$watch($attrs.fmWith, function (oldVal, newVal) {
				var withObj = $scope.$parent[$attrs.fmWith];
				(function copyPropertiesToScope(withObj) {
					for (var prop in withObj) {

						if (withObj.hasOwnProperty(prop)) {
							Object.defineProperty($scope, prop, {
								enumerable: true,
								configurable: true,
								get: $parse(prop).bind($scope, withObj, $scope.$parent),
								set: $parse(prop).assign.bind($scope, withObj, $scope.$parent),
							});
						}
					}
				})(withObj);
			});
		}

		controller.$inject = ['$scope', '$attrs', '$parse'];

		return {
			restrict: 'A',
			scope: true,
			controller: controller
		};
	}
	
	withDirective.$inject = [];

	angular.module('core').directive('fmWith', withDirective);
})();
