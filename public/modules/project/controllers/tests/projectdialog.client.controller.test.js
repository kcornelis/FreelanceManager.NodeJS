'use strict';

(function() {
	describe('ProjectDialogController Unit Tests:', function() {
		//Initialize global variables
		var scope, 
			ProjectDialogController,
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

		describe('when the controller is created for an existing project', function(){

			beforeEach(inject(function($controller) {
				
				toUpdate = { id: 2, name: 'abc', description: 'description' };

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: toUpdate
				});
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newProject).toBe(false);
			});			

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a reference to the project to update', function(){
				toUpdate.name = 'updatedName';
				expect(scope.originalProject.name).toBe('updatedName');
			});

			it('should have a copy of the project to update', function(){
				toUpdate.name = 'updatedName';
				toUpdate.description = 'description';
				expect(scope.project.name).toBe('abc');
			});
		});	

		describe('when the controller is created for a new project', function(){

			beforeEach(inject(function($controller, $rootScope) {

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newProject).toBe(true);
			});				

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a project to edit', function(){
				expect(scope.project.name).toBe('');
				expect(scope.project.description).toBe('');
			});
		});	

		describe('when an existing project is saved with success', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'abc', description: 'description' };

				// create a mock for the project server
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

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Project: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving project...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the project to the backend with te correct data', function(){

				scope.project.name = 'updated';
				scope.project.description = 'updated description';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam.name).toBe('updated');
				expect(mockService.dataParam.description).toBe('updated description');
			});
		});		

		describe('when a project is saved with an error', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'abc', description: 'description' };

				// create a mock for the project service
				mockService = {
					save: function(id, data, success, error){
						this.flush = error;
					}
				};

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Project: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving project...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('An error occurred...');
				expect(scope.isBusy).toBe(true);
			});
		});		

		describe('when a new project is saved with success', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the project service
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

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: undefined,
					Project: mockService
				});
			}));

			it('should show a message in the ui', function(){
				
				scope.ok();

				expect(scope.message).toBe('Saving project...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the project to the backend with te correct data', function(){

				scope.project.name = 'new';				
				scope.project.description = 'new description';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(undefined);
				expect(mockService.dataParam.name).toBe('new');
				expect(mockService.dataParam.description).toBe('new description');
			});

			it('should close the dialog', function(){

				scope.ok();
				mockService.flush();

				expect(scope.$close).toHaveBeenCalledWith(scope.project);
			});
		});

		describe('when the dialog is cancelled', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the project service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					save: function(){}
				};

				spyOn(mockService, 'save');

				ProjectDialogController = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should not save the project', function(){
				
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
