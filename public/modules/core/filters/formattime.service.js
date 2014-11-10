'use strict';

angular.module('core').filter('formattime', function () {
    return function(a){
    	if(_.has(a, 'hour') && _.has(a, 'minutes')){
    		return ("00" + a.hour).slice(-2) + ':' + ("00" + a.minutes).slice(-2);
    	}
    	else if(_.isNumber(a)){
    		var hour = Math.floor(a / 60);
			var minutes = Math.floor(a - (hour * 60));
    		return ("00" + hour).slice(-2) + ':' + ("00" + minutes).slice(-2);
    	}
        else return '-';
    }
});