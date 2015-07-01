(function() {
	'use strict';

	describe('Invoice Report Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('Year tests:', function() {

			var scope, 
				controller;
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20101231';

				controller = $controller('InvoiceReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('2010');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-12-31');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-01-01');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2011-01-01');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2011-12-31');
				});				
			});
		});

		describe('Month tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100131';

				controller = $controller('InvoiceReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('January 2010');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-01-31');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-12-01');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2010-02-01');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2010-02-28');
				});				
			});
		});

		describe('Week tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100107';

				controller = $controller('InvoiceReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a title', function() {
					expect(scope.title).toBe('2010-01-01 - 2010-01-07');
				});
			
				it('should have a from date', function() {
					expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-01');
				});

				it('should have a to date', function() {
					expect(scope.to.format('YYYY-MM-DD')).toBe('2010-01-07');
				});					

				it('should have a previous from date', function() {
					expect(scope.previousFrom.format('YYYY-MM-DD')).toBe('2009-12-25');
				});

				it('should have a previous to date', function() {
					expect(scope.previousTo.format('YYYY-MM-DD')).toBe('2009-12-31');
				});

				it('should have a next from date', function() {
					expect(scope.nextFrom.format('YYYY-MM-DD')).toBe('2010-01-08');
				});

				it('should have a next to date', function() {
					expect(scope.nextTo.format('YYYY-MM-DD')).toBe('2010-01-14');
				});				
			});
		});

		describe('Common tests:', function() {

			var scope, 
				controller;			
			
			beforeEach(inject(function($controller, $rootScope, $stateParams, $state, $httpBackend) {
				scope = $rootScope.$new();

				$stateParams.from = '20100101';
				$stateParams.to = '20100107';

				controller = $controller('InvoiceReportController', {
					$scope: scope
				});

				scope.$apply();
			}));

			describe('initial state', function() {

				it('should have a week start', function() {
					expect(scope.weekStart).toBe(moment().startOf('isoWeek').format('YYYYMMDD'));
				});

				it('should have a week end', function() {
					expect(scope.weekEnd).toBe(moment().endOf('isoWeek').format('YYYYMMDD'));
				});	

				it('should have a month start', function() {
					expect(scope.monthStart).toBe(moment().startOf('month').format('YYYYMMDD'));
				});

				it('should have a month end', function() {
					expect(scope.monthEnd).toBe(moment().endOf('month').format('YYYYMMDD'));
				});	

				it('should have a year start', function() {
					expect(scope.yearStart).toBe(moment().startOf('year').format('YYYYMMDD'));
				});

				it('should have a year end', function() {
					expect(scope.yearEnd).toBe(moment().endOf('year').format('YYYYMMDD'));
				});												
			});

			describe('$scope.previous', function() {

				beforeEach(inject(function($state) {
					$state.expectTransitionTo('app.invoice_report', { from: '20091225', to: '20091231'});

					scope.previous();
					scope.$apply();
				}));				

				it('should navigate to the invoice report state with the new params', inject(function($state) {
					$state.ensureAllTransitionsHappened();
				}));
			});	

			describe('$scope.next', function() {

				beforeEach(inject(function($state) {
					$state.expectTransitionTo('app.invoice_report', { from: '20100108', to: '20100114'});

					scope.next();
					scope.$apply();
				}));				

				it('should navigate to the invoice report state with the new params', inject(function($state) {
					$state.ensureAllTransitionsHappened();
				}));
			});

			describe('$scope.refresh', function() {

				beforeEach(inject(function($httpBackend) {

					$httpBackend.expectGET('/api/public/invoices/getinfoforperiodpercustomer/20100101/20100107').respond(
					[{ totalWithoutVatInCents: 15000, customer: { name: 'c1' } },
					{ totalWithoutVatInCents: 10000, customer: { name: 'c2' } } ]);

					scope.refresh();

					expect(scope.loading).toBe(true);		

					$httpBackend.flush();
				}));

				it('should set $scope.infoPerCustomer', function() {
					expect(scope.infoPerCustomer[0].totalWithoutVatInCents).toBe(15000);
				});

				it('should set $scope.invoiceGraph', function() {
					expect(scope.invoiceGraph[0].label).toBe('c1');
					expect(scope.invoiceGraph[0].data).toBe(150);

					expect(scope.invoiceGraph[1].label).toBe('c2');
					expect(scope.invoiceGraph[1].data).toBe(100);
				});

				it('should set $scope.totalWithoutVatInCents', function() {
					expect(scope.totalWithoutVatInCents).toBe(25000);
				});

				it('should set $scope.totalWithoutVat', function() {
					expect(scope.totalWithoutVat).toBe(250);
				});

				it('should set the has invoices flag', function() {
					expect(scope.hasInvoices).toBe(true);
				});

				it('should clear the loading flag', function() {
					expect(scope.loading).toBe(false);
				});	
			});

			describe('$scope.refresh no data', function() {

				beforeEach(inject(function($httpBackend) {

					$httpBackend.expectGET('/api/public/invoices/getinfoforperiodpercustomer/20100101/20100107').respond([]);

					scope.refresh();

					expect(scope.loading).toBe(true);		

					$httpBackend.flush();
				}));

				it('should set the has invoices flag', function() {
					expect(scope.hasInvoices).toBe(false);
				});

				it('should clear the loading flag', function() {
					expect(scope.loading).toBe(false);
				});			
			});
		});
	});
})();
