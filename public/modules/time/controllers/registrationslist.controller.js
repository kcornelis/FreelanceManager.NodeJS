'use strict';

angular.module('time').controller('RegistrationsListController',
function($scope, $modal, $location, $stateParams, TimeRegistration) {

	$scope.date = new moment($stateParams.date, 'YYYYMMDD');
	$scope.hasTimeRegistrations = false;

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
