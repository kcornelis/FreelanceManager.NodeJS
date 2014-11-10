
'use strict';

angular.module('time').controller('TimeController',
function($scope, $location, $stateParams) {

	$scope.defaultDate = new moment();
	$scope.defaultFrom = new moment().subtract(1, 'month');
	$scope.defaultTo = new moment();
});
