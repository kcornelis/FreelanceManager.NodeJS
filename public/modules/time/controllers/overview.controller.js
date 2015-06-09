(function() {
	'use strict';

	function controller($scope, $modal, $location, $state, $stateParams, TimeRegistration) {

		$scope.date = moment($stateParams.date, 'YYYYMMDD');
		$scope.hasTimeRegistrations = false;

		$scope.$watch('date', function(){
			$scope.displayDate = $scope.date.format('YYYY-MM-DD');
		});

		$scope.nextDate = function(){
			$state.go('app.time_overview', { date: moment($scope.date.add(1, 'days')).format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.previousDate = function(){
			$state.go('app.time_overview', { date: $scope.date.subtract(1, 'days').format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.changeDate = function(date, format){
			$state.go('app.time_overview', { date: moment(date, format).format('YYYYMMDD') }, { location: 'replace' });
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

			createDialog.result.then(function (data) {
				if(data.deleted) {
					_.remove($scope.timeRegistrations, function(item) { return item.id === data.deleted; });
				}
				else {
					var c = _.find($scope.timeRegistrations, { 'id': data.id });
					if(c) angular.copy(data, c);
					else $scope.timeRegistrations.push(data);
				}

				$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
			});		
		};
	}

	controller.$inject = ['$scope', '$modal', '$location', '$state', '$stateParams', 'TimeRegistration'];

	angular.module('time').controller('OverviewController', controller);
})();
