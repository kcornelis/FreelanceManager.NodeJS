// TODO unit test
// From the angle project
angular.module('core').directive("now", ['dateFilter', '$interval', function(dateFilter, $interval){
	return {
		restrict: 'E',
		link: function(scope, element, attrs){
			
			var format = attrs.format;

			function updateTime() {
				var dt = dateFilter(new Date(), format);
				element.text(dt);
			}

			updateTime();
			$interval(updateTime, 1000);
		}
	};
}]);