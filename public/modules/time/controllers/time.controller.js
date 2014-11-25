'use strict';

angular.module('time').controller('TimeController',
function($scope, $location, $stateParams) {

	$scope.today = new moment();
	$scope.firstOfCurrentMonth = new moment().startOf('month');
	$scope.lastOfCurrentMonth = new moment().endOf('month');	
});
