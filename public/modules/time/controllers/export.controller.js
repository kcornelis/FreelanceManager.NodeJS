angular.module('time').controller('ExportController',
function($scope, $state, $stateParams, TimeRegistration) {
	'use strict';

	$scope.from = moment($stateParams.from, 'YYYYMMDD');
	$scope.to = moment($stateParams.to, 'YYYYMMDD');

	$scope.hasTimeRegistrations = false;	
	$scope.loading = false;

	$scope.from = moment($stateParams.from, 'YYYYMMDD');
	$scope.to = moment($stateParams.to, 'YYYYMMDD');

	$scope.thisWeek = moment().day(1).format('YYYYMMDD') + '/' + moment().day(7).format('YYYYMMDD');
	$scope.lastWeek = moment().day(1).subtract(7, 'days').format('YYYYMMDD') + '/' + moment().day(7).subtract(7, 'days').format('YYYYMMDD');

	$scope.thisMonth = moment().set('date', 1).format('YYYYMMDD') + '/' + moment().set('date', moment().daysInMonth()).format('YYYYMMDD');
	$scope.lastMonth = moment().set('date', 1).subtract(1, 'months').format('YYYYMMDD') + '/' + moment().subtract(1, 'months').set('date', moment().subtract(1, 'months').daysInMonth()).format('YYYYMMDD');

	$scope.thisYear = moment().set('month', 0).set('date', 1).format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).format('YYYYMMDD');
	$scope.lastYear = moment().set('month', 0).set('date', 1).subtract(1, 'years').format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).subtract(1, 'years').format('YYYYMMDD');
	
	$scope.$watch('from', function(){
		$scope.displayFrom = $scope.from.format('YYYY-MM-DD');
	});

	$scope.$watch('to', function(){
		$scope.displayTo = $scope.to.format('YYYY-MM-DD');
	});	

	$scope.changeFrom = function(date, format){
		$scope.from = moment(date, format);
	};

	$scope.changeTo = function(date, format){
		$scope.to = moment(date, format);
	};

	$scope.applyDate = function(){
		$state.go('app.time_export', { from: $scope.from.format('YYYYMMDD'), to: $scope.to.format('YYYYMMDD') }, { location: 'replace' });
	};

	$scope.refresh = function() {

		$scope.loading = true;

		TimeRegistration.byrange({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') }, function(tr){

			 var grouped = _.groupBy(tr, function (i) { return i.date.numeric; });
			 $scope.timeRegistrations = _.sortBy(_.map(grouped, function (g) {
					return {
						date: _.first(g).date,
						items: g
					};
				}),
			 function(i){
			 	return i.date.numeric;
			 });

			$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
			$scope.loading = false;
		});
	};	
});
