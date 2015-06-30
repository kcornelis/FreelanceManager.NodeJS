(function() {
	'use strict';
	
	describe('Invoice Overview Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend, $stateParams) {

				scope = $rootScope.$new();
				$stateParams.from = '20100101';

				controller = $controller('InvoiceOverviewController', {
					$scope: scope
				});
			}));

			it('should store the year we want to see invoices for in $scope.year', function() {
				expect(scope.year).toBe(2010);
			});
		});

		describe('$scope.getAllInvoices', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend, $stateParams) {

				scope = $rootScope.$new();
				$stateParams.from = '20150101';
				$stateParams.to = '20151231';

				controller = $controller('InvoiceOverviewController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/invoices/bydate/20150101/20151231').respond([
					{ id: 10, date: { numeric: 2 } }, 
					{ id: 11, date: { numeric: 1 } }]);

				scope.getAllInvoices();
				$httpBackend.flush();
			}));

			it('should store all invoices in $scope.invoices ordered by date', function() {
				expect(scope.invoices[0].id).toBe(11);
				expect(scope.invoices[1].id).toBe(10);
			});
		});

		describe('$scope.next', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend, $stateParams) {

				scope = $rootScope.$new();
				$stateParams.from = '20100101';

				controller = $controller('InvoiceOverviewController', {
					$scope: scope
				});
			}));

			it('should navigate to the invoice overview for the next year', inject(function($state) {
				$state.expectTransitionTo('app.invoice_overview', { from: '20110101', to: '20111231' });

				scope.next();
				scope.$apply();

				$state.ensureAllTransitionsHappened();
			}));
		});

		describe('$scope.previous', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend, $stateParams) {

				scope = $rootScope.$new();
				$stateParams.from = '20100101';

				controller = $controller('InvoiceOverviewController', {
					$scope: scope
				});
			}));

			it('should navigate to the invoice overview for the previous year', inject(function($state) {
				$state.expectTransitionTo('app.invoice_overview', { from: '20090101', to: '20091231' });

				scope.previous();
				scope.$apply();

				$state.ensureAllTransitionsHappened();
			}));
		});
	});
})();
