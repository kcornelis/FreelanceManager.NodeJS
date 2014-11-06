'use strict';

(function() {
	describe('CompanyDialogController Unit Tests:', function() {
		//Initialize global variables
		var scope, 
			CompanyDialogController,
			toUpdate;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($rootScope) {
			scope = $rootScope.$new();

			// mock the close and dismiss methods from the dialog
			scope.$close = function(){};
			scope.$dismiss = function(){};
			spyOn(scope, '$close');
			spyOn(scope, '$dismiss');
		}));

		describe('when the controller is created for an existing company', function(){

			beforeEach(inject(function($controller) {
				
				toUpdate = { id: 2, name: 'abc' };

				CompanyDialogController = $controller('CompanyDialogController', {
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

			it('should have a reference to the company to update', function(){
				toUpdate.name = 'updatedName';
				expect(scope.originalCompany.name).toBe('updatedName');
			});

			it('should have a copy of the company to update', function(){
				toUpdate.name = 'updatedName';
				expect(scope.company.name).toBe('abc');
			});
		});	

		describe('when the controller is created for a new company', function(){

			beforeEach(inject(function($controller, $rootScope) {

				CompanyDialogController = $controller('CompanyDialogController', {
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

			it('should have a company to edit', function(){
				expect(scope.company.name).toBe('');
			});
		});	

		describe('when an existing company is saved with success', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'abc' };

				// create a mock for the company server
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(id, data, success, error){
						this.dataParam = data;
						this.idParam = id;
						this.flush = success;
					}
				};

				CompanyDialogController = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Company: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the company to the backend with te correct data', function(){

				scope.company.name = 'updated';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam.name).toBe('updated');
			});
		});		

		describe('when a company is saved with an error', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'abc' };

				// create a mock for the company service
				mockService = {
					save: function(id, data, success, error){
						this.flush = error;
					}
				};

				CompanyDialogController = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Company: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('An error occurred...');
				expect(scope.isBusy).toBe(true);
			});
		});		

		describe('when a new company is saved with success', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the company service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(id, data, success, error){
						this.dataParam = data;
						this.idParam = id;
						this.flush = function(){ success(data); };
					}
				};

				CompanyDialogController = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: undefined,
					Company: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving company...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the company to the backend with te correct data', function(){

				scope.company.name = 'new';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(undefined);
				expect(mockService.dataParam.name).toBe('new');
			});

			it('should close the dialog', function(){

				scope.ok();
				mockService.flush();

				expect(scope.$close).toHaveBeenCalledWith(scope.company);
			});
		});	

		describe('when the dialog is cancelled', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the company service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(){}
				};

				spyOn(mockService, 'save');

				CompanyDialogController = $controller('CompanyDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should not save the company', function(){
				
				scope.cancel();

				expect(mockService.save).not.toHaveBeenCalled();
			});


			it('should close the dialog', function(){
				
				scope.cancel();

				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
