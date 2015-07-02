(function() {
	'use strict';
	
	describe('Create Invoice Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('CreateInvoiceController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/projects').respond([
					{ name: 'project1', company: { name: 'company2' } }, 
					{ name: 'project3', company: { name: 'company1' } },
					{ name: 'project2', company: { name: 'company1' } }]);

				$httpBackend.expectGET('/api/public/templates/active').respond([
					{ name: 'template1' }, 
					{ name: 'template2' }]);

				$httpBackend.flush();
				scope.init();
			}));

			it('should store all projects in $scope.projects, ordered by company name, then by project name', function() {
				expect(scope.projects[0].name).toBe('project2');
				expect(scope.projects[1].name).toBe('project3');
				expect(scope.projects[2].name).toBe('project1');
			});

			it('should store all active temlates in $scope.templates', function() {
				expect(scope.templates[0].name).toBe('template1');
				expect(scope.templates[1].name).toBe('template2');
			});

			it('should show the first wizard page', function() {
				expect(scope.active(1)).toBe(true);
				expect(scope.active(2)).toBe(false);
				expect(scope.active(3)).toBe(false);
				expect(scope.active(4)).toBe(false);
			});
		});	

		describe('step 1 (select time registrations)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('CreateInvoiceController', {
					$scope: scope
				});
				scope.init();
			}));

			describe('$scope.searchTimeRegistrations', function() {
				
				it('should store all time registrations for the search parameters in $scope.timeRegistrations, ordered by date, then by from', inject(function($httpBackend) {
					
					scope.search.project = 1;
					scope.search.from = '2015-01-01';
					scope.search.to = '2015-01-02';
					scope.search.invoiced = true;
					scope.search.billable = false;

					$httpBackend.expectGET('/api/public/projects').respond([
						{ name: 'project1', company: { name: 'company2' } }, 
						{ name: 'project3', company: { name: 'company1' } },
						{ name: 'project2', company: { name: 'company1' } }]);

					$httpBackend.expectGET('/api/public/templates/active').respond([
						{ name: 'template1' }, 
						{ name: 'template2' }]);

					$httpBackend.expectGET('/api/public/timeregistrations/search?billable=false&from=20150101&invoiced=true&project=1&to=20150102').respond([
						{ description: '1', date: { numeric: 2 }, from: { numeric: 1 } }, 
						{ description: '2', date: { numeric: 2 }, from: { numeric: 2 } },
						{ description: '3', date: { numeric: 1 }, from: { numeric: 3 } }]);

					scope.searchTimeRegistrations();
					$httpBackend.flush();

					expect(scope.timeRegistrations[0].description).toBe('3');
					expect(scope.timeRegistrations[1].description).toBe('1');
					expect(scope.timeRegistrations[2].description).toBe('2');
				}));

				it('should set $scope.loading to true, when finished to false', inject(function($httpBackend) {

					$httpBackend.expectGET('/api/public/projects').respond([
						{ name: 'project1', company: { name: 'company2' } }, 
						{ name: 'project3', company: { name: 'company1' } },
						{ name: 'project2', company: { name: 'company1' } }]);

					$httpBackend.expectGET('/api/public/templates/active').respond([
						{ name: 'template1' }, 
						{ name: 'template2' }]);

					$httpBackend.expectGET('/api/public/timeregistrations/search?billable=true&invoiced=false').respond([
						{ description: '1', date: { numeric: 1 }, from: { numeric: 2 } }, 
						{ description: '2', date: { numeric: 3 }, from: { numeric: 1 } },
						{ description: '3', date: { numeric: 2 }, from: { numeric: 1 } }]);

					scope.searchTimeRegistrations();
					expect(scope.loading).toBe(true);
					$httpBackend.flush();
					expect(scope.loading).toBe(false);
				}));

				it('should set $scope.includeAllTimeRegistrations to false', function() {
					scope.includeAllTimeRegistrations = true;
					scope.searchTimeRegistrations();
					expect(scope.includeAllTimeRegistrations).toBe(false);
				});
			});

			describe('$scope.includeAllTimeRegistrations', function() {

				beforeEach(inject(function($httpBackend) {
					scope.search.project = 1;
					scope.search.from = '2015-01-01';
					scope.search.to = '2015-01-02';
					scope.search.invoiced = true;
					scope.search.billable = false;

					$httpBackend.expectGET('/api/public/projects').respond([
						{ name: 'project1', company: { name: 'company2' } }, 
						{ name: 'project3', company: { name: 'company1' } },
						{ name: 'project2', company: { name: 'company1' } }]);

					$httpBackend.expectGET('/api/public/templates/active').respond([
						{ name: 'template1' }, 
						{ name: 'template2' }]);

					$httpBackend.expectGET('/api/public/timeregistrations/search?billable=false&from=20150101&invoiced=true&project=1&to=20150102').respond([
						{ description: '1', date: { numeric: 1 }, from: { numeric: 2 } }, 
						{ description: '2', date: { numeric: 3 }, from: { numeric: 1 } },
						{ description: '3', date: { numeric: 2 }, from: { numeric: 1 } }]);

					scope.searchTimeRegistrations();
					$httpBackend.flush();
				}));
				
				it('should include all time registrations when the previous value was false', function() {
					
					expect(scope.includeAllTimeRegistrations).toBe(false);

					scope.includeAllTimeRegistrations = true;
					scope.$apply();

					expect(scope.includeAllTimeRegistrations).toBe(true);
					expect(_.every(scope.timeRegistrations, 'included', true)).toBe(true);
				});

				it('should exclude all time registrations when the previous value was true', function() {
					
					scope.includeAllTimeRegistrations = true;
					scope.$apply();
					scope.includeAllTimeRegistrations = false;
					scope.$apply();

					expect(scope.includeAllTimeRegistrations).toBe(false);
					expect(_.every(scope.timeRegistrations, 'included', false)).toBe(true);
				});
			});
		});

		describe('step 2 (invoice lines)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('CreateInvoiceController', {
					$scope: scope
				});
				scope.init();

				scope.search.project = 1;
				scope.search.from = '2015-01-01';
				scope.search.to = '2015-01-02';
				scope.search.invoiced = true;
				scope.search.billable = false;

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project1', tasks: [ { name: 'development', defaultRateInCents: 5000 }, { name: 'meeting', defaultRateInCents: 0 } ]  }, 
					{ id: 2, name: 'project2', tasks: [ { name: 'development', defaultRateInCents: 1234 } ] }]);

				$httpBackend.expectGET('/api/public/templates/active').respond([
					{ name: 'template1' }, 
					{ name: 'template2' }]);

				$httpBackend.expectGET('/api/public/timeregistrations/search?billable=false&from=20150101&invoiced=true&project=1&to=20150102').respond([
					{ id: 1, projectId: 1, task: 'development', totalMinutes: 60 }, 
					{ id: 2, projectId: 1, task: 'meeting', totalMinutes: 50 },
					{ id: 3, projectId: 1, task: 'development', totalMinutes: 40 },
					{ id: 4, projectId: 2, task: 'development', totalMinutes: 30 },
					{ id: 5, projectId: 2, task: 'development', totalMinutes: 20 }]);

				scope.searchTimeRegistrations();

				$httpBackend.flush();
			}));

			describe('$scope.canGoto2', function() {
				
				it('should return true if at least one time registration is included', function() {
					scope.timeRegistrations[0].included = true;

					expect(scope.canGoto2()).toBe(true);
				});

				it('should return false if no time registration are included', function() {
					expect(scope.canGoto2()).toBe(false);
				});
			});

			describe('$scope.gobackto2', function() {
				
				it('should activate the second wizard step', function() {
					scope.gobackto2();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(true);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(false);
				});
			});

			describe('$scope.goto2', function() {
				
				beforeEach(function() {
					scope.timeRegistrations[0].included = true;
					scope.timeRegistrations[1].included = true;
					scope.timeRegistrations[2].included = true;
					scope.timeRegistrations[3].included = true;

					scope.goto2();
				});

				it('should activate the second wizard step', function() {
					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(true);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(false);
				});

				it('should grab all included time registration ids', function() {

					expect(scope.invoice.linkedTimeRegistrationIds).toContain(1);
					expect(scope.invoice.linkedTimeRegistrationIds).toContain(2);
					expect(scope.invoice.linkedTimeRegistrationIds).toContain(3);
					expect(scope.invoice.linkedTimeRegistrationIds).toContain(4);
					expect(scope.invoice.linkedTimeRegistrationIds.length).toBe(4);
				});

				it('should fill invoice lines, invoice line description is the project name and task', function() {
					expect(scope.invoice.lines[0].description).toBe('project1 - development');
					expect(scope.invoice.lines[1].description).toBe('project1 - meeting');
					expect(scope.invoice.lines[2].description).toBe('project2 - development');
				});

				it('should fill invoice lines, quantity is the sum of the time registration total minutes in hours', function() {
					expect(scope.invoice.lines[0].quantity).toBe(1.67);
					expect(scope.invoice.lines[1].quantity).toBe(0.83);
					expect(scope.invoice.lines[2].quantity).toBe(0.5);
				});

				it('should fill invoice lines, varPercentages is or now fixed to 21%', function() {
					expect(scope.invoice.lines[0].vatPercentage).toBe(21);
					expect(scope.invoice.lines[1].vatPercentage).toBe(21);
					expect(scope.invoice.lines[1].vatPercentage).toBe(21);
				});

				it('should fill invoice lines, price is the quantity multiplied with the task price', function() {
					expect(scope.invoice.lines[0].price).toBe(50);
					expect(scope.invoice.lines[0].priceInCents).toBe(5000);

					expect(scope.invoice.lines[1].price).toBe(0);
					expect(scope.invoice.lines[1].priceInCents).toBe(0);

					expect(scope.invoice.lines[2].price).toBe(12.34);
					expect(scope.invoice.lines[2].priceInCents).toBe(1234);
				});
			});

			describe('$scope.removeInvoiceLine', function() {
				
				beforeEach(function() {
					scope.timeRegistrations[0].included = true;
					scope.timeRegistrations[1].included = true;
					scope.timeRegistrations[2].included = true;
					scope.timeRegistrations[3].included = true;

					scope.goto2();
				});

				it('should remove the selected invoice line', function() {
					expect(scope.invoice.lines[0].description).toBe('project1 - development');
					expect(scope.invoice.lines[1].description).toBe('project1 - meeting');
					expect(scope.invoice.lines[2].description).toBe('project2 - development');

					scope.removeInvoiceLine(scope.invoice.lines[0]);

					expect(scope.invoice.lines[0].description).toBe('project1 - meeting');
					expect(scope.invoice.lines[1].description).toBe('project2 - development');
				});
			});

			describe('$scope.addInvoiceLine', function() {
				
				beforeEach(function() {
					scope.timeRegistrations[0].included = true;
					scope.timeRegistrations[1].included = true;
					scope.timeRegistrations[2].included = true;
					scope.timeRegistrations[3].included = true;

					scope.goto2();
				});

				it('should add an empty invoice line', function() {
					scope.addInvoiceLine();

					expect(scope.invoice.lines[3].description).toBe('');
					expect(scope.invoice.lines[3].quantity).toBe(1);
					expect(scope.invoice.lines[3].vatPercentage).toBe(21);
					expect(scope.invoice.lines[3].price).toBe(0);
					expect(scope.invoice.lines[3].priceInCents).toBe(0);
				});
			});

			describe('invoice line changes', function() {
				
				beforeEach(function() {
					scope.timeRegistrations[0].included = true;
					scope.timeRegistrations[1].included = true;
					scope.timeRegistrations[2].included = true;
					scope.timeRegistrations[3].included = true;

					scope.goto2();
					scope.$apply();
				});

				it('should update the total price', function() {
					expect(scope.invoice.lines[0].total).toBe(83.50);
					expect(scope.invoice.lines[0].totalInCents).toBe(8350);

					expect(scope.invoice.lines[1].total).toBe(0);
					expect(scope.invoice.lines[1].totalInCents).toBe(0);

					expect(scope.invoice.lines[2].total).toBe(6.17);
					expect(scope.invoice.lines[2].totalInCents).toBe(617);
				});

				it('should update the price in cents when the price changes', function() {
					scope.invoice.lines[0].price = 10;
					scope.$apply();

					expect(scope.invoice.lines[0].price).toBe(10);
					expect(scope.invoice.lines[0].priceInCents).toBe(1000);
				});

				it('should not update the price in cents when the quantity changes', function() {
					scope.invoice.lines[0].quantity = 5;
					scope.$apply();

					expect(scope.invoice.lines[0].price).toBe(50);
					expect(scope.invoice.lines[0].priceInCents).toBe(5000);
				});

				it('should update the total price in cents when the quantity changes', function() {
					scope.invoice.lines[0].quantity = 5;
					scope.$apply();

					expect(scope.invoice.lines[0].total).toBe(250);
					expect(scope.invoice.lines[0].totalInCents).toBe(25000);
				});

				it('should update the price for a new invoice line', function() {
					scope.addInvoiceLine();
					scope.$apply();

					expect(scope.invoice.lines[3].price).toBe(0);
					expect(scope.invoice.lines[3].priceInCents).toBe(0);
				});

				it('should update the total price for a new invoice line', function() {
					scope.addInvoiceLine();
					scope.$apply();

					expect(scope.invoice.lines[3].total).toBe(0);
					expect(scope.invoice.lines[3].totalInCents).toBe(0);
				});
			});
		});

		describe('step 3 (invoice details)', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('CreateInvoiceController', {
					$scope: scope
				});
				scope.init();

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project1', tasks: [ { name: 'development', defaultRateInCents: 5000 }, { name: 'meeting', defaultRateInCents: 0 } ]  }, 
					{ id: 2, name: 'project2', tasks: [ { name: 'development', defaultRateInCents: 1234 } ] }]);

				$httpBackend.expectGET('/api/public/templates/active').respond([
					{ id: 1, content: 'template1' }, 
					{ id: 2, content: 'template2' }]);

				$httpBackend.flush();
			}));

			describe('$scope.gobackto3', function() {
				
				it('should activate the third wizard step', function() {
					scope.gobackto3();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(true);
					expect(scope.active(4)).toBe(false);
				});
			});

			describe('$scope.goto3', function() {
				
				it('should activate the third wizard step', function() {
					scope.goto3();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(true);
					expect(scope.active(4)).toBe(false);
				});
			});

			describe('when $scope.invoice.displayDate changes', function() {
				
				it('should update $scope.invoice.date', function() {
					scope.invoice.displayDate = '20150331';
					scope.$apply();

					expect(scope.invoice.date).toBe('20150331');
				});

				it('should update $scope.invoice.displayCreditTerm', function() {
					scope.invoice.displayDate = '20150331';
					scope.$apply();

					expect(scope.invoice.displayCreditTerm).toBe('2015-04-30');
				});

				it('should clear $scope.invoice.date when no date is provided', function() {
					scope.invoice.displayDate = '';
					scope.$apply();

					expect(scope.invoice.date).toBe(null);
				});

				it('should clear $scope.invoice.displayCreditTerm when no date is provided', function() {
					scope.invoice.displayDate = '';
					scope.$apply();

					expect(scope.invoice.displayCreditTerm).toBe(null);
				});
			});

			describe('when $scope.invoice.displayCreditTerm changes', function() {
				
				it('should update $scope.invoice.creditTerm', function() {
					scope.invoice.displayCreditTerm = '20150430';
					scope.$apply();

					expect(scope.invoice.creditTerm).toBe('20150430');
				});

				it('should clear $scope.invoice.creditTerm when no creditTerm is provided', function() {
					scope.invoice.displayCreditTerm = '';
					scope.$apply();

					expect(scope.invoice.creditTerm).toBe(null);
				});
			});

			describe('when $scope.invoice.templateId changes', function() {
				
				it('should find the template and store its content in $scope.invoice.template', function() {
					scope.invoice.templateId = 1;
					scope.$apply();

					expect(scope.invoice.template).toBe('template1');
				});
			});

			describe('$scope.searchCustomer', function() {

				var dialog;

				beforeEach(inject(function($modal) {

					dialog = {
						result: {
							then: function(confirmCallback, cancelCallback) {
								this.confirmCallBack = confirmCallback;
								this.cancelCallback = cancelCallback;
							}
						},
						close: function(item) {
							this.result.confirmCallBack(item);
						},
						dismiss: function(type) {
							this.result.cancelCallback(type);
						}
					};

					sinon.stub($modal, 'open', function() { return dialog; });
				}));

				it('should update the invoice details if the dialog returned a customer', function() {
					scope.searchCustomer();

					dialog.close({
						name: 'company',
						vatNumber: 'BE1234',
						number: '1',
						address: {
							line1: 'line1',
							line2: 'line2',
							postalcode: '1234',
							city: 'brussels'
						}
					});

					expect(scope.invoice.customer.name).toBe('company');
					expect(scope.invoice.customer.vatNumber).toBe('BE1234');
					expect(scope.invoice.customer.number).toBe('1');
					expect(scope.invoice.customer.address.line1).toBe('line1');
					expect(scope.invoice.customer.address.line2).toBe('line2');
					expect(scope.invoice.customer.address.postalcode).toBe('1234');
					expect(scope.invoice.customer.address.city).toBe('brussels');
				});
			});
		});

		describe('step 4 (preview)', function() {

			var scope, 
				controller,
				invoiceMock;

			beforeEach(inject(function($controller, $rootScope) {

				invoiceMock = {
					_i: null,
					_cb: null,
					flush: function() { this._cb(this._i); }, // just pass the invoice to the callback
					preview: function(i, cb) {
						expect(i.id).toBe(1);

						this._i = i;
						this._cb = cb;
					},
					save: function(i, cb) {
						expect(i.id).toBe(1);

						this._i = i;
						this._cb = cb;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('CreateInvoiceController', {
					$scope: scope,
					Invoice: invoiceMock
				});
				scope.init();
			}));

			describe('$scope.goto4', function() {
				
				it('should activate the third wizard step', function() {
					scope.invoice.id = 1;
					scope.goto4();

					expect(scope.active(1)).toBe(false);
					expect(scope.active(2)).toBe(false);
					expect(scope.active(3)).toBe(false);
					expect(scope.active(4)).toBe(true);
				});

				it('should set $scope.loading when the preview is generated', function() {
					scope.invoice.id = 1;
					scope.goto4();

					expect(scope.loading).toBe(true);

					invoiceMock.flush();

					expect(scope.loading).toBe(false);
				});

				it('should load the preview', function() {
					scope.invoice.id = 1;

					scope.goto4();
					invoiceMock.flush();

					expect(scope.invoicePreview.id).toBe(1);
				});

				it('should create a preview url', function() {
					scope.invoice.id = 1;

					scope.goto4();
					invoiceMock.flush();

					expect(scope.previewUrl.$$unwrapTrustedValue()).toBe('/render/#!/invoicepreview?invoice=%7B%22customer%22%3A%7B%22address%22%3A%7B%7D%7D%2C%22id%22%3A1%7D');
				});
			});

			describe('$scope.create', function() {
				
				it('should send the invoice to the backend and then redirect to the overview page', inject(function($state) {
					scope.invoice.id = 1;
					$state.expectTransitionTo('app.invoice_overview');

					scope.create();
					invoiceMock.flush();

					$state.ensureAllTransitionsHappened();
				}));
			});
		});
	});
})();
