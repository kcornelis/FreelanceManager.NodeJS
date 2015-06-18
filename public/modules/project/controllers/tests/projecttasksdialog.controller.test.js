(function() {
	'use strict';

	describe('Project Tasks Dialog Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('when the controller is created', function() {

			var scope, 
				controller,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = toUpdate = { id: 2, name: 'name', tasks: [
					{ name: 'Development', defaultRateInCents: 50 },
					{ name: 'Sleeping', defaultRateInCents: 0 }
				]};

				scope = $rootScope.$new();
				controller = $controller('ProjectTasksDialogController', {
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

			it('should have a reference to the project to update', function() {
				toUpdate.name = 'updatedName';
				expect(scope.originalProject.name).toBe('updatedName');
			});

			it('should have a copy of the project to update', function() {
				toUpdate.tasks[0].name = 'hello';

				expect(scope.project.tasks[0].name).toBe('Development');
				expect(scope.project.tasks[0].defaultRateInCents).toBe(50);
				expect(scope.project.tasks[1].name).toBe('Sleeping');
				expect(scope.project.tasks[1].defaultRateInCents).toBe(0);
			});

			it('should have default rate not in cents', function() {
				expect(scope.project.tasks[0].defaultRate).toBe(0.5);
				expect(scope.project.tasks[1].defaultRate).toBe(0);
			});
		});	

		describe('when the default price is changed', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: { id: 2, name: 'name', tasks: [
						{ name: 'Development', defaultRateInCents: 50 },
						{ name: 'Sleeping', defaultRateInCents: 0 }
					] }
				});

				scope.project.tasks[0].defaultRate = 0;
				scope.project.tasks[1].defaultRate = 50.25;

				scope.$apply();
			}));

			it('should update the default rate in cents', function() {
				expect(scope.project.tasks[0].defaultRateInCents).toBe(0);
				expect(scope.project.tasks[1].defaultRateInCents).toBe(5025);				
			});
		});	

		describe('when an existing project is saved with success', function() {

			var scope, 
				controller,
				mockService;

			beforeEach(inject(function($controller, $rootScope) {

				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					changetasks: function(id, data, success, error) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = success;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: { id: 2, name: 'name', tasks: [
						{ name: 'Development', defaultRateInCents: 50 },
						{ name: 'Sleeping', defaultRateInCents: 0 }
					] },
					Project: mockService
				});
				scope.$close = function() { };
			}));

			it('should show a message in the ui', function() {
				scope.ok();

				expect(scope.message).toBe('Saving project...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the project to the backend with te correct data', function() {
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

		describe('when a project is saved with an error', function() {

			var scope, 
				controller,
				mockService,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, name: 'name', tasks: [
					{ name: 'Development', defaultRateInCents: 50 },
					{ name: 'Sleeping', defaultRateInCents: 0 }
				] };

				// create a mock for the project service
				mockService = {
					changetasks: function(id, data, success, error) {
						this.flush = error;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Project: mockService
				});
				scope.$close = function() { };
			}));

			it('should show a message in the ui', function() {
				scope.ok();

				expect(scope.message).toBe('Saving project...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('An error occurred...');
				expect(scope.isBusy).toBe(true);
			});
		});		

		describe('when the dialog is cancelled', function() {

			var scope, 
				controller,
				mockService;

			beforeEach(inject(function($controller, $rootScope) {

				mockService = {
					dataParam: null,
					idParam: null,
					flush: null,
					changetasks: function() { }
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectTasksDialogController', {
					$scope: scope,
					toUpdate: undefined
				});

				scope.$dismiss = function() { };
				spyOn(scope, '$dismiss');
				spyOn(mockService, 'changetasks');
			}));

			it('should not save the project', function() {
				scope.cancel();
				expect(mockService.changetasks).not.toHaveBeenCalled();
			});

			it('should close the dialog', function() {
				scope.cancel();
				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
