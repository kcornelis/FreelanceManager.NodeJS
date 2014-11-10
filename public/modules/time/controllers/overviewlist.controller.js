'use strict';

angular.module('time').controller('OverviewListController',
function($scope, $modal, $location, $stateParams, TimeRegistration) {

	$scope.from = new moment($stateParams.from, 'YYYYMMDD');
	$scope.to = new moment($stateParams.to, 'YYYYMMDD');

	$scope.hasTimeRegistrations = false;

	$scope.refresh = function() {

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
		});
	};
});
