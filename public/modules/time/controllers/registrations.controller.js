'use strict';

angular.module('time').controller('RegistrationsController',
function($scope, $location, $stateParams) {

	$scope.date = new moment($stateParams.date, 'YYYYMMDD');
	
	$scope.$watch('date', function(){
		$scope.displayDate = $scope.date.format('YYYY-MM-DD');
	});

	$scope.nextDate = function(){
		$scope.date = new moment($scope.date.add('days', 1));
		$location.path('/time/' + $scope.date.format('YYYYMMDD'));
	};

	$scope.previousDate = function(){
		$scope.date = new moment($scope.date.subtract('days', 1));
		$location.path('/time/' + $scope.date.format('YYYYMMDD'));
	};

	$scope.changeDate = function(date, format){
		$scope.date = new moment(date, format);
		$location.path('/time/' + $scope.date.format('YYYYMMDD'));
	};

	$scope.openDateSelector = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		$scope.dateSelectorOpen = true;
  	};
});
