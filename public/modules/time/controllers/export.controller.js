angular.module('time').controller('ExportController',
function($scope, $state, $stateParams, TimeRegistration) {
	'use strict';

	$scope.from = new moment($stateParams.from, 'YYYYMMDD');
	$scope.to = new moment($stateParams.to, 'YYYYMMDD');

	$scope.hasTimeRegistrations = false;	
	$scope.loading = false;

	$scope.from = new moment($stateParams.from, 'YYYYMMDD');
	$scope.to = new moment($stateParams.to, 'YYYYMMDD');

	$scope.thisWeek = new moment().day(1).format('YYYYMMDD') + '/' + new moment().day(7).format('YYYYMMDD');
	$scope.lastWeek = new moment().day(1).subtract('days', 7).format('YYYYMMDD') + '/' + new moment().day(7).subtract('days', 7).format('YYYYMMDD');

	$scope.thisMonth = new moment().set('date', 1).format('YYYYMMDD') + '/' + new moment().set('date', new moment().daysInMonth()).format('YYYYMMDD');
	$scope.lastMonth = new moment().set('date', 1).subtract('months', 1).format('YYYYMMDD') + '/' + new moment().subtract('months', 1).set('date', new moment().subtract('months', 1).daysInMonth()).format('YYYYMMDD');

	$scope.thisYear = new moment().set('month', 0).set('date', 1).format('YYYYMMDD') + '/' + new moment().set('month', 11).set('date', 31).format('YYYYMMDD');
	$scope.lastYear = new moment().set('month', 0).set('date', 1).subtract('years', 1).format('YYYYMMDD') + '/' + new moment().set('month', 11).set('date', 31).subtract('years', 1).format('YYYYMMDD');
	
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
		$state.go('app.time_export', { from: $scope.from.format('YYYYMMDD'), to: $scope.to.format('YYYYMMDD') }, { location: 'replace' });
	};

	$scope.refresh = function() {

		$scope.loading = true;

		TimeRegistration.byrange({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') }, function(tr){

			 var grouped = _.groupBy(tr, function (i) { return i.date.numeric });
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
