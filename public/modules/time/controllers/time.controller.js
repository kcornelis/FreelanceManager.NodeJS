
'use strict';

angular.module('time').controller('TimeController',
function($scope, $location, $stateParams) {

	$scope.today = new moment();
	$scope.firstOfCurrentMonth = new moment().set('date', 1);
	$scope.lastOfCurrentMonth = new moment().set('date', new moment().daysInMonth());
});
