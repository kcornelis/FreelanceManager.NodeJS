
'use strict';

angular.module('time').controller('ReportController',
function($scope, $location, $stateParams, TimeRegistration) {
	
	$scope.from = new moment($stateParams.from, 'YYYYMMDD');
	$scope.to = new moment($stateParams.to, 'YYYYMMDD');

	// is this a full year?
	if($scope.from.date() == 1 && $scope.from.month() == 0 &&
		$scope.to.date() == 31 && $scope.to.month() == 11 &&
		$scope.from.year() == $scope.to.year())
	{
		$scope.title = $scope.from.format('YYYY');

		$scope.previousFrom = new moment($scope.from).subtract(1, 'year');
		$scope.previousTo = new moment($scope.to).subtract(1, 'year');
		$scope.nextFrom = new moment($scope.from).add(1, 'year');
		$scope.nextTo = new moment($scope.to).add(1, 'year');
	}
	// is this a full month?
	else if($scope.from.date() == 1 && new moment($scope.from).endOf('month').date() == $scope.to.date() &&
		$scope.from.month() == $scope.to.month() &&
		$scope.from.year() == $scope.to.year())
	{
		$scope.title = $scope.from.format('MMMM YYYY');

		$scope.previousFrom = new moment($scope.from).subtract(1, 'month').startOf('month');
		$scope.previousTo = new moment($scope.from).subtract(1, 'month').endOf('month');
		$scope.nextFrom = new moment($scope.from).add(1, 'month').startOf('month');
		$scope.nextTo = new moment($scope.from).add(1, 'month').endOf('month');
	}
	else {
		$scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
		
		var days = $scope.to.diff($scope.from, 'days') + 1;
		$scope.previousFrom = new moment($scope.from).subtract(days, 'days');
		$scope.previousTo = new moment($scope.to).subtract(days, 'days');
		$scope.nextFrom = new moment($scope.from).add(days, 'days');
		$scope.nextTo = new moment($scope.to).add(days, 'days');
	}

	$scope.weekStart = new moment().startOf('isoWeek').format('YYYYMMDD');
	$scope.weekEnd = new moment().endOf('isoWeek').format('YYYYMMDD');
	$scope.monthStart = new moment().startOf('month').format('YYYYMMDD');
	$scope.monthEnd = new moment().endOf('month').format('YYYYMMDD');
	$scope.yearStart = new moment().startOf('year').format('YYYYMMDD');
	$scope.yearEnd = new moment().endOf('year').format('YYYYMMDD')


	$scope.previous = function(){
		$location.path('/time/report/' + $scope.previousFrom.format('YYYYMMDD') + '/' + $scope.previousTo.format('YYYYMMDD')).replace();
	}

	$scope.next = function(){
		$location.path('/time/report/' + $scope.nextFrom.format('YYYYMMDD') + '/' + $scope.nextTo.format('YYYYMMDD')).replace();
	}

	$scope.refresh = function() {

		$scope.loading = true;

		TimeRegistration.getinfo({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') })
			.$promise.then(function(b){

				$scope.summary = b.summary;

				var grouped = _.groupBy(b.perTask, function(i) { 
					return JSON.stringify({ 
						c: i.companyId,
						p: i.projectId
					});
				});

				$scope.infoPerProject = _.map(grouped, function (g) {
					return {
						companyId: g[0].companyId,
						company: g[0].company,
						projectId: g[0].projectId,
						project: g[0].project,
						tasks: g
					};
				});
			})
			.finally(function(){
				$scope.billableUnbillableGraph = [
					{ label: "Billable", data: $scope.summary.billableMinutes, color: '#7266BA' },
					{ label: "Unbillable", data: $scope.summary.unBillableMinutes, color: '#5D9CEC' }
				];
				
				if($scope.summary.unBillableMinutes || $scope.summary.billableMinutes)
					$scope.hasHours = true;
				else $scope.hasHours = false;
				
				$scope.loading = false;
			});
	};
});
