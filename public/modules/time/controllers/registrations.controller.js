'use strict';

angular.module('time').controller('RegistrationsController',
function($scope, $modal, $location, $stateParams, TimeRegistration) {

	$scope.date = new moment($stateParams.date, 'YYYYMMDD');
	$scope.displayDate = $scope.date.format('YYYY-MM-DD');
	$scope.hasTimeRegistrations = false;

	$scope.nextDate = function(){
		$location.path('/time/' + $scope.date.add('days', 1).format('YYYYMMDD'));
	};

	$scope.previousDate = function(){
		$location.path('/time/' + $scope.date.subtract('days', 1).format('YYYYMMDD'));
	};

	$scope.changeDate = function(date, format){
		$location.path('/time/' + new moment(date, format).format('YYYYMMDD'));
	};

	$scope.refresh = function() {
		$scope.timeRegistrations = TimeRegistration.bydate({ date: $scope.date.format('YYYYMMDD') }, function(){
			$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
		});
	};

	$scope.openDateSelector = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		$scope.dateSelectorOpen = true;
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
