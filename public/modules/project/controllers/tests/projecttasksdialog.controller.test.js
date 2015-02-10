(function() {
	'use strict';

	describe('ProjectTasksDialogController Unit Tests:', function() {

		var scope, 
			ProjectTasksDialogController,
			toUpdate;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function($rootScope) {
			scope = $rootScope.$new();

			// mock the close and dismiss methods from the dialog
			scope.$close = function(){};
			scope.$dismiss = function(){};
			spyOn(scope, '$close');
			spyOn(scope, '$dismiss');
		}));

		describe('when the controller is created', function(){

			beforeEach(inject(function($controller) {
				
				toUpdate = { id: 2, name: 'name', tasks: [
					{ name: 'Development', defaultRateInCents: 50 },
					{ name: 'Sleeping', defaultRateInCents: 0 }
				] };

				ProjectTasksDialogController = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: toUpdate
				});
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});	

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a reference to the project to update', function(){
				toUpdate.name = 'updatedName';
				expect(scope.originalProject.name).toBe('updatedName');
			});

			it('should have a copy of the project to update', function(){

				toUpdate.tasks[0].name = 'hello';

				expect(scope.project.tasks[0].name).toBe('Development');
				expect(scope.project.tasks[0].defaultRateInCents).toBe(50);
				expect(scope.project.tasks[1].name).toBe('Sleeping');
				expect(scope.project.tasks[1].defaultRateInCents).toBe(0);
			});
		});	

		describe('when an existing project is saved with success', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'name', tasks: [
					{ name: 'Development', defaultRateInCents: 50 },
					{ name: 'Sleeping', defaultRateInCents: 0 }
				] };

				// create a mock for the project server
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					changetasks: function(id, data, success, error){
						this.dataParam = data;
						this.idParam = id;
						this.flush = success;
					}
				};

				ProjectTasksDialogController = $controller('ProjectTasksDialogController', {
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

				scope.project.tasks[0].defaultRateInCents = 40;

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam[0].name).toBe('Development');
				expect(mockService.dataParam[0].defaultRateInCents).toBe(40);
				expect(mockService.dataParam[1].name).toBe('Sleeping');
				expect(mockService.dataParam[1].defaultRateInCents).toBe(0);
			});
		});		

		describe('when a project is saved with an error', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'name', tasks: [
					{ name: 'Development', defaultRateInCents: 50 },
					{ name: 'Sleeping', defaultRateInCents: 0 }
				] };

				// create a mock for the project service
				mockService = {
					changetasks: function(id, data, success, error){
						this.flush = error;
					}
				};

				ProjectTasksDialogController = $controller('ProjectTasksDialogController', {
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

		describe('when the dialog is cancelled', function(){

			var mockService;

			beforeEach(inject(function($controller, $rootScope) {

				// create a mock for the project service
				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					changetasks: function(){}
				};

				spyOn(mockService, 'changetasks');

				ProjectTasksDialogController = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should not save the project', function(){
				
				scope.cancel();

				expect(mockService.changetasks).not.toHaveBeenCalled();
			});


			it('should close the dialog', function(){
				
				scope.cancel();

				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
