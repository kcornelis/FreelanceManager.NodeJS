'use strict';

angular.module('time').controller('OverviewController',
function($scope, $location, $stateParams) {

	$scope.from = new moment($stateParams.from, 'YYYYMMDD');
	$scope.to = new moment($stateParams.to, 'YYYYMMDD');
	
	$scope.$watch('from', function(){
		$scope.displayFrom = $scope.from.format('YYYY-MM-DD');
	});

	$scope.$watch('to', function(){
		$scope.displayTo = $scope.to.format('YYYY-MM-DD');
	});	

	$scope.changeFrom = function(date, format){
		$scope.from = new moment(date, format);
	};

	$scope.changeTo = function(date, format){
		$scope.to = new moment(date, format);
	};

	$scope.applyDate = function(){
		$location.path('/time/overview/' + $scope.from.format('YYYYMMDD') + '/' + $scope.to.format('YYYYMMDD')).replace();
	};
});
