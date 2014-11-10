'use strict';

angular.module('time').controller('RegistrationsController',
function($scope, $location, $stateParams) {

	$scope.date = new moment($stateParams.date, 'YYYYMMDD');
	
	$scope.$watch('date', function(){
		$scope.displayDate = $scope.date.format('YYYY-MM-DD');
	});

	$scope.nextDate = function(){
		$scope.date = new moment($scope.date.add(1, 'days'));
		$location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
	};

	$scope.previousDate = function(){
		$scope.date = new moment($scope.date.subtract(1, 'days'));
		$location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
	};

	$scope.changeDate = function(date, format){
		$scope.date = new moment(date, format);
		$location.path('/time/registrations/' + $scope.date.format('YYYYMMDD')).replace();
	};
});
