angular.module('core').filter('moment', 
function () {
	'use strict';
	
	return function(date, format){
		return date.format(format);
	};
});