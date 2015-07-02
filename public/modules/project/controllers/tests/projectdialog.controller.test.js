(function() {
	'use strict';
	
	describe('Project Dialog Controller Unit Tests:', function() {

		var mockCompanyService = {
			query: function(callback) {
				callback([{ id: 1, name: 'company 1' }, { id: 2, name: 'company 2' }]);
			}
		};

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('when the controller is created for an existing project', function() {

			var scope, 
				controller,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, companyId: 'companyId', name: 'abc', description: 'description' };

				scope = $rootScope.$new();
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					Company: mockCompanyService,
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

			it('should have a list of all companies', function() {
				expect(scope.companies.length).toBe(2);
				expect(scope.companies[0].name).toBe('company 1');
				expect(scope.companies[1].name).toBe('company 2');
			});

			it('should have a reference to the project to update', function() {
				toUpdate.name = 'updatedName';
				expect(scope.originalProject.name).toBe('updatedName');
			});

			it('should have a copy of the project to update', function() {
				toUpdate.companyId = 'myCompanyId';
				toUpdate.name = 'updatedName';
				toUpdate.description = 'updatedDescription';

				expect(scope.project.companyId).toBe('companyId');
				expect(scope.project.name).toBe('abc');
				expect(scope.project.description).toBe('description');
			});
		});	

		describe('when the controller is created for a new project', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					Company: mockCompanyService,
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

			it('should have a list of all companies', function() {
				expect(scope.companies.length).toBe(2);
				expect(scope.companies[0].name).toBe('company 1');
				expect(scope.companies[1].name).toBe('company 2');
			});

			it('should have a project to edit', function() {
				expect(scope.project.name).toBe('');
				expect(scope.project.description).toBe('');
				expect(scope.project.companyId).toBe('');
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
					save: function(id, data, success, error) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = success;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: { id: 2, name: 'abc', description: 'description' },
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

				scope.project.name = 'updated';
				scope.project.description = 'updated description';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam.name).toBe('updated');
				expect(mockService.dataParam.description).toBe('updated description');
			});
		});		

		describe('when a project is saved with an error', function() {

			var scope, 
				controller,
				mockService;

			beforeEach(inject(function($controller, $rootScope) {

				mockService = {
					save: function(id, data, success, error) {
						this.flush = error;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: { id: 2, name: 'abc', description: 'description' },
					Project: mockService
				});
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

		describe('when a new project is saved with success', function() {

			var scope, 
				controller,
				mockService;

			beforeEach(inject(function($controller, $rootScope) {

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
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: undefined,
					Project: mockService
				});

				scope.$close = function() { };
				spyOn(scope, '$close');
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

				scope.project.name = 'new';				
				scope.project.description = 'new description';
				scope.project.companyId = 'companyid';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(undefined);
				expect(mockService.dataParam.name).toBe('new');
				expect(mockService.dataParam.description).toBe('new description');
				expect(mockService.dataParam.companyId).toBe('companyid');
			});

			it('should close the dialog', function() {

				scope.ok();
				mockService.flush();

				expect(scope.$close).toHaveBeenCalledWith(scope.project);
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
					save: function() { }
				};

				scope = $rootScope.$new();
				controller = $controller('ProjectDialogController', {
					$scope: scope,
					toUpdate: undefined
				});

				scope.$dismiss = function() { };
				spyOn(scope, '$dismiss');
				spyOn(mockService, 'save');
			}));

			it('should not save the project', function() {
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
