angular.module('time').controller('OverviewController',
function($scope, $modal, $location, $state, $stateParams, TimeRegistration) {
	'use strict';

	$scope.date = new moment($stateParams.date, 'YYYYMMDD');
	$scope.hasTimeRegistrations = false;

	$scope.$watch('date', function(){
		$scope.displayDate = $scope.date.format('YYYY-MM-DD');
	});

	$scope.nextDate = function(){
		$scope.date = new moment($scope.date.add(1, 'days'));
		$state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
	};

	$scope.previousDate = function(){
		$scope.date = new moment($scope.date.subtract(1, 'days'));
		$state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
	};

	$scope.changeDate = function(date, format){
		$scope.date = new moment(date, format);
		$state.go('app.time_overview', { date: $scope.date.format('YYYYMMDD') }, { location: 'replace' });
	};

	$scope.refresh = function() {
		TimeRegistration.bydate({ date: $scope.date.format('YYYYMMDD') }, function(timeRegistrations){
			$scope.hasTimeRegistrations = timeRegistrations.length > 0;
			$scope.timeRegistrations = _.sortBy(timeRegistrations,
				function(i){
					return i.from.numeric;
				});
		});
	};

	$scope.openTimeRegistration = function(timeRegistration){

		var createDialog = $modal.open({
			templateUrl: '/modules/time/views/timeregistrationdialog.html',
			controller: 'TimeRegistrationDialogController',
			size: 'lg',
			resolve: {
				toUpdate: function () {
					return timeRegistration;
				},
				date: function(){
					return $scope.date.format('YYYYMMDD');
				}
			}
		});

		createDialog.result.then(function (timeRegistration) {
			var c = _.find($scope.timeRegistrations, { 'id': timeRegistration.id });
			if(c) angular.copy(timeRegistration, c);
			else $scope.timeRegistrations.push(timeRegistration);

			$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
		});		
	}
});
