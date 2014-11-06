'use strict';

angular.module('core').filter('formattime', function () {
    return function(a){
        return("00" + a).slice(-2)
    }
});