angular.module('core').filter('formatdate', 
function () {
	'use strict';

	return function(a){
		if(_.has(a, 'year') && _.has(a, 'month') && _.has(a, 'day')){
			return a.year + '-' + ('00' + a.month).slice(-2) + '-' + ('00' + a.day).slice(-2);
		}
		else return '-';
	};
});