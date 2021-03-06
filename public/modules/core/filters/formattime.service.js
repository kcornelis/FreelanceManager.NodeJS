(function() {
	'use strict';

	function formattimeFilter() {
		return function(a) {
			if(_.has(a, 'hour') && _.has(a, 'minutes')) {
				return ('00' + a.hour).slice(-2) + ':' + ('00' + a.minutes).slice(-2);
			}
			else if(_.isNumber(a)) {
				var hour = Math.floor(a / 60);
				var minutes = Math.floor(a - (hour * 60));
				if(hour > 99) {
					return hour + ':' + ('00' + minutes).slice(-2); 
				}else{
				  return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
				}
			}
			else return '-';
		};
	}
	
	formattimeFilter.$inject = [];

	angular.module('fmCore').filter('formattime', formattimeFilter);
})();
