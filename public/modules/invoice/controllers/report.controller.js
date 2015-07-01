(function() {
	'use strict';

	function controller($scope, $location, $state, $stateParams, Invoice) {

		$scope.from = moment($stateParams.from, 'YYYYMMDD');
		$scope.to = moment($stateParams.to, 'YYYYMMDD');

		// is this a full year?
		if($scope.from.date() === 1 && $scope.from.month() === 0 &&
			$scope.to.date() === 31 && $scope.to.month() === 11 &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'year');
			$scope.previousTo = moment($scope.to).subtract(1, 'year');
			$scope.nextFrom = moment($scope.from).add(1, 'year');
			$scope.nextTo = moment($scope.to).add(1, 'year');
		}
		// is this a full month?
		else if($scope.from.date() === 1 && moment($scope.from).endOf('month').date() === $scope.to.date() &&
			$scope.from.month() === $scope.to.month() &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('MMMM YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'month').startOf('month');
			$scope.previousTo = moment($scope.from).subtract(1, 'month').endOf('month');
			$scope.nextFrom = moment($scope.from).add(1, 'month').startOf('month');
			$scope.nextTo = moment($scope.from).add(1, 'month').endOf('month');
		}
		else {
			$scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
			
			var days = $scope.to.diff($scope.from, 'days') + 1;
			$scope.previousFrom = moment($scope.from).subtract(days, 'days');
			$scope.previousTo = moment($scope.to).subtract(days, 'days');
			$scope.nextFrom = moment($scope.from).add(days, 'days');
			$scope.nextTo = moment($scope.to).add(days, 'days');
		}

		$scope.weekStart = moment().startOf('isoWeek').format('YYYYMMDD');
		$scope.weekEnd = moment().endOf('isoWeek').format('YYYYMMDD');
		$scope.monthStart = moment().startOf('month').format('YYYYMMDD');
		$scope.monthEnd = moment().endOf('month').format('YYYYMMDD');
		$scope.yearStart = moment().startOf('year').format('YYYYMMDD');
		$scope.yearEnd = moment().endOf('year').format('YYYYMMDD');

		$scope.previous = function() {
			$state.go('app.invoice_report', { from: $scope.previousFrom.format('YYYYMMDD'), to: $scope.previousTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.next = function() {
			$state.go('app.invoice_report', { from: $scope.nextFrom.format('YYYYMMDD'), to: $scope.nextTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.refresh = function() {

			$scope.loading = true;

			Invoice.getinfoforperiodpercustomer({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') },
				function(result) {

					$scope.infoPerCustomer = result;
					$scope.invoiceGraph = _.map(result, function(r) {
						return { label: r.company.name, data: r.totalWithoutVatInCents / 100 };
					});
					$scope.totalWithoutVatInCents = _.sum(result, 'totalWithoutVatInCents');
					$scope.totalWithoutVat = $scope.totalWithoutVatInCents / 100;
					$scope.hasInvoices = result && result.length > 0;

					$scope.loading = false;
				});
		};
	}

	controller.$inject = ['$scope', '$location', '$state', '$stateParams', 'Invoice'];

	angular.module('fmInvoice').controller('InvoiceReportController', controller);
})();
