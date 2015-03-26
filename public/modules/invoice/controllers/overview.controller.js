angular.module('invoice').controller('InvoiceOverviewController',
function($scope, Invoice, $state, $stateParams) {
	'use strict';

	$scope.year = moment($stateParams.from, 'YYYYMMDD').year();

	$scope.getAllInvoices = function() {
		$scope.invoices = Invoice.bydate({ from: $stateParams.from, to:  $stateParams.to });
	};

	$scope.previous = function(){
		$state.go('app.invoice_overview', { from: (($scope.year - 1) + '0101'), to: (($scope.year - 1) + '1231') }, { location: 'replace' });
	};

	$scope.next = function(){
		$state.go('app.invoice_overview', { from: (($scope.year + 1) + '0101'), to: (($scope.year + 1) + '1231') }, { location: 'replace' });
	};
});
