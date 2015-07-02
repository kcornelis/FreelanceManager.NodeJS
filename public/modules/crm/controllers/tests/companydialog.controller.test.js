(function() {
	'use strict';

	describe('Company Dialog Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('when the controller is created for an existing company', function() {

			var scope, 
				controller,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'abc', number: '1', vatNumber: 'BE1234', address: { line1: 'l1', line2: 'l2', postalcode: 'pc', city: 'c'} };
				
				scope = $rootScope.$new();
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: toUpdate
				});
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newCompany).toBe(false);
			});			

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a reference to the company to update', function() {
				toUpdate.name = 'updatedName';
				expect(scope.originalCompany.name).toBe('updatedName');
			});

			it('should have a copy of the company to update', function() {
				toUpdate.name = 'updated name';
				toUpdate.number = 'updated number';
				toUpdate.vatNumber = 'updated vat';
				toUpdate.address.line1 = 'update line';
				toUpdate.address.line2 = 'update line';
				toUpdate.address.postalcode = 'update pc';
				toUpdate.address.city = 'update city';


				expect(scope.company.name).toBe('abc');
				expect(scope.company.number).toBe('1');
				expect(scope.company.vatNumber).toBe('BE1234');
				expect(scope.company.address.line1).toBe('l1');
				expect(scope.company.address.line2).toBe('l2');
				expect(scope.company.address.postalcode).toBe('pc');
				expect(scope.company.address.city).toBe('c');
			});					
		});	

		describe('when the controller is created for a new company', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newCompany).toBe(true);
			});				

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a company to edit', function() {
				expect(scope.company).not.toBeNull();
			});
		});	

		describe('when an existing company is saved with success', function() {

			var mockService,
				scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(id, data, success, error) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = success;
					}
				};

				scope = $rootScope.$new();
				scope.$close = function() { };
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate:  { id: 2, name: 'abc' },
					Company: mockService
				});
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the company to the backend with te correct data', function() {

				scope.company.name = 'updated';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam.name).toBe('updated');
			});
		});		

		describe('when a company is saved with an error', function() {

			var mockService,
				scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the company service
				mockService = {
					save: function(id, data, success, error) {
						this.flush = error;
					}
				};

				scope = $rootScope.$new();
				scope.$close = function() { };
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: { id: 2, name: 'abc' },
					Company: mockService
				});
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('An error occurred...');
				expect(scope.isBusy).toBe(true);
			});
		});		

		describe('when a new company is saved with success', function() {

			var mockService,
				scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the company service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(id, data, success, error) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = function() { success(data); };
					}
				};

				scope = $rootScope.$new();
				scope.$close = function() { };
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: undefined,
					Company: mockService
				});

				spyOn(scope, '$close');
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the company to the backend with te correct data', function() {

				scope.company.name = 'new';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(undefined);
				expect(mockService.dataParam.name).toBe('new');
			});

			it('should close the dialog', function() {

				scope.ok();
				mockService.flush();

				expect(scope.$close).toHaveBeenCalledWith(scope.company);
			});
		});	

		describe('when the dialog is cancelled', function() {

			var mockService,
				scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the company service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function() { }
				};

				scope = $rootScope.$new();
				scope.$dismiss = function() { };
				controller = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: undefined
				});

				spyOn(scope, '$dismiss');
				spyOn(mockService, 'save');
			}));

			it('should not save the company', function() {
				scope.cancel();
				expect(mockService.save).not.toHaveBeenCalled();
			});


			it('should close the dialog', function() {
				scope.cancel();
				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
