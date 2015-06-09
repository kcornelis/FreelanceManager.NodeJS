(function() {
	'use strict';

	function controller($scope, Invoice, $state, $stateParams) {

		$scope.year = moment($stateParams.from, 'YYYYMMDD').year();

		$scope.getAllInvoices = function() {
			Invoice.bydate({ from: $stateParams.from, to:  $stateParams.to }, function(invoices){
				$scope.invoices = _.sortBy(invoices, function(i) { return i.date.numeric; });
			});
		};

		$scope.previous = function(){
			$state.go('app.invoice_overview', { from: (($scope.year - 1) + '0101'), to: (($scope.year - 1) + '1231') }, { location: 'replace' });
		};

		$scope.next = function(){
			$state.go('app.invoice_overview', { from: (($scope.year + 1) + '0101'), to: (($scope.year + 1) + '1231') }, { location: 'replace' });
		};
	}

	controller.$inject = ['$scope', 'Invoice', '$state', '$stateParams'];

	angular.module('invoice').controller('InvoiceOverviewController', controller);
})();
