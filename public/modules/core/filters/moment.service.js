'use strict';

angular.module('core').filter('moment', function () {
    return function(date, format){
        return date.format(format);
    }
});