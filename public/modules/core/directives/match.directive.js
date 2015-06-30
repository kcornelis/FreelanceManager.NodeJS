(function() {
	'use strict';

	function matchDirective ($parse) {
		return {
			require: '?ngModel',
			restrict: 'A',
			link: function(scope, elem, attrs, ctrl) {
				if(!ctrl) {
					if(console && console.warn) {

						console.warn('Match validation requires ngModel to be on the element');
					}
					return;
				}

				var matchGetter = $parse(attrs.fmMatch);

				function getMatchValue() {

					var match = matchGetter(scope);
					if(angular.isObject(match) && match.hasOwnProperty('$viewValue')) {

						match = match.$viewValue;
					}
					return match;
				}

				scope.$watch(getMatchValue, function() {

					ctrl.$validate();
				});

				ctrl.$validators.match = function() {

					return ctrl.$viewValue === getMatchValue();
				};
			}
		};
	}
	
	matchDirective.$inject = ['$parse'];

	angular.module('fmCore').directive('fmMatch', matchDirective);
})();
