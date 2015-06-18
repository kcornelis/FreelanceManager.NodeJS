(function() {
	'use strict';

	describe('Time Registration Dialog Controller Unit Tests:', function() {

		var mockProjectService = {
			active: function(callback) {
				mockProjectService.flush = callback;
				return [
					{ id: 1, name: 'project 1', companyId: 1,
					  tasks: [ { name: 'Development', defaultRateInCents: 0 }, { name: 'Meeting', defaultRateInCents: 5 } ],
					  company: { id: 1, name: 'company 1' } 
					}, 
					{ id: 2, name: 'project 2', companyId: 1,
					  tasks: [ { name: 'Development', defaultRateInCents: 0 }, { name: 'Meeting', defaultRateInCents: 5 } ],
					  company: { id: 1, name: 'company 1' } 
					}, 
					{ id: 3, name: 'project 3', companyId: 1,
					  tasks: [ { name: 'Development', defaultRateInCents: 0 } ],
					  company: { id: 1, name: 'company 1' } 
					}, 
					{ id: 4, name: 'project 4', companyId: 2,
					  tasks: [ { name: 'Development', defaultRateInCents: 0 }, { name: 'Meeting', defaultRateInCents: 5 } ],
					  company: { id: 2, name: 'company 2' } 
					}];
			},
			flush: function() {}
		};

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('when the controller is created for an existing time registration', function() {

			var scope, 
				controller,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {
				
				toUpdate = { id: 2, companyId: 1, projectId: 1, description: 'description', task: 'Development', from: { numeric: 1000 }, to: { numeric: 1100 } };

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: toUpdate,
					date: 20100102
				});

				mockProjectService.flush();
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newTimeRegistration).toBe(false);
			});			

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a list of all projects', function() {
				expect(scope.projects.length).toBe(4);
				expect(scope.projects[0].name).toBe('project 1');
				expect(scope.projects[1].name).toBe('project 2');
				expect(scope.projects[2].name).toBe('project 3');
				expect(scope.projects[3].name).toBe('project 4');				
			});

			it('should have a list of all companies with projects and tasks', function() {
				expect(scope.companies.length).toBe(2);
				expect(scope.companies[0].name).toBe('company 1');
				expect(scope.companies[1].name).toBe('company 2');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].name).toBe('project 1');
				expect(scope.companies[0].projects[1].name).toBe('project 2');
				expect(scope.companies[0].projects[2].name).toBe('project 3');

				expect(scope.companies[1].projects.length).toBe(1);
				expect(scope.companies[1].projects[0].name).toBe('project 4');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].tasks[0].name).toBe('Development');
			
			});

			it('should have a property that shows if the project is editable', function() {
				expect(scope.projectEditable).toBe(true); // project id 1 is returned by the mock
			});

			it('should have a reference to the time registration to update', function() {
				toUpdate.description = 'updated';
				expect(scope.originalTimeRegistration.description).toBe('updated');
			});

			it('should have a copy of the time registration to update', function() {
			
				toUpdate.description = 'updatedDescription';
				toUpdate.from = 1200;
				toUpdate.to = 1300;

				expect(scope.timeRegistration.company.name).toBe('company 1');
				expect(scope.timeRegistration.project.name).toBe('project 1');
				expect(scope.timeRegistration.task.name).toBe('Development');
				expect(scope.timeRegistration.description).toBe('description');
				expect(scope.timeRegistration.from).toBe('10:00');
				expect(scope.timeRegistration.to).toBe('11:00');
			});
		});	

		describe('when the controller is created for an existing time registration with an inactive project', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {
				
				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: { id: 2, companyId: 1, projectId: 10, description: 'description', task: 'Development', from: { numeric: 1000 }, to: { numeric: 1100 } },
					date: 20100102
				});

				mockProjectService.flush();
			}));

			it('should have a list of all projects', function() {
				expect(scope.projects.length).toBe(4);
				expect(scope.projects[0].name).toBe('project 1');
				expect(scope.projects[1].name).toBe('project 2');
				expect(scope.projects[2].name).toBe('project 3');
				expect(scope.projects[3].name).toBe('project 4');				
			});

			it('should have a list of all companies with projects and tasks', function() {
				expect(scope.companies.length).toBe(2);
				expect(scope.companies[0].name).toBe('company 1');
				expect(scope.companies[1].name).toBe('company 2');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].name).toBe('project 1');
				expect(scope.companies[0].projects[1].name).toBe('project 2');
				expect(scope.companies[0].projects[2].name).toBe('project 3');

				expect(scope.companies[1].projects.length).toBe(1);
				expect(scope.companies[1].projects[0].name).toBe('project 4');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].tasks[0].name).toBe('Development');
			
			});

			it('should have a property that shows if the project is editable', function() {
				expect(scope.projectEditable).toBe(false); // project id 10 is not returned by the mock
			});
		});	

		describe('when the controller is created for a new project', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: undefined,
					date: 20100102
				});

				mockProjectService.flush();
			}));

			it('should not be busy', function() {
				expect(scope.isBusy).toBe(false);
			});

			it('should not be new', function() {
				expect(scope.newTimeRegistration).toBe(true);
			});				

			it('should have no message', function() {
				expect(scope.message).toBe('');
			});

			it('should have a list of all companies', function() {
				expect(scope.projects.length).toBe(4);
				expect(scope.projects[0].name).toBe('project 1');
				expect(scope.projects[1].name).toBe('project 2');
				expect(scope.projects[2].name).toBe('project 3');
				expect(scope.projects[3].name).toBe('project 4');
			});

			it('should have a list of all companies with projects and tasks', function() {
				expect(scope.companies.length).toBe(2);
				expect(scope.companies[0].name).toBe('company 1');
				expect(scope.companies[1].name).toBe('company 2');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].name).toBe('project 1');
				expect(scope.companies[0].projects[1].name).toBe('project 2');
				expect(scope.companies[0].projects[2].name).toBe('project 3');

				expect(scope.companies[1].projects.length).toBe(1);
				expect(scope.companies[1].projects[0].name).toBe('project 4');

				expect(scope.companies[0].projects.length).toBe(3);
				expect(scope.companies[0].projects[0].tasks[0].name).toBe('Development');
			
			});		

			it('should have a property that shows if the project is editable', function() {
				expect(scope.projectEditable).toBe(true); // project of a new tr is always editable
			});	

			it('should have a project to edit', function() {
				expect(scope.timeRegistration.description).toBe('');
				expect(scope.timeRegistration.company).toBe(null);
				expect(scope.timeRegistration.project).toBe(null);
				expect(scope.timeRegistration.task).toBe(null);
				expect(scope.timeRegistration.from).toBe('');
				expect(scope.timeRegistration.to).toBe('');
			});
		});	

		describe('when an existing time registration is saved with success', function() {

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
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					toUpdate: { id: 2, companyId: 1, projectId: 1, description: 'description', task: 'Development', from: { numeric: 1000 }, to: { numeric: 1100 } },
					Project: mockProjectService,
					TimeRegistration: mockService,
					date: 20100102
				});
				scope.$close = function() { };

				mockProjectService.flush();
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving time registration...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the time registration to the backend with te correct data', function() {

				scope.timeRegistration.description = 'updated description';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(2);
				expect(mockService.dataParam.description).toBe('updated description');
			});
		});		

		describe('when a project is saved with an error', function() {

			var scope, 
				controller,
				mockService,
				toUpdate;

			beforeEach(inject(function($controller, $rootScope) {

				toUpdate = { id: 2, companyId: 1, projectId: 1, description: 'description', task: 'Development', from: { numeric: 1000 }, to: { numeric: 1100 } };

				// create a mock for the project service
				mockService = {
					save: function(id, data, success, error) {
						this.flush = error;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					toUpdate: toUpdate,
					Project: mockProjectService,
					TimeRegistration: mockService,
					date: 20100102
				});
				scope.$close = function() { };

				mockProjectService.flush();
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving time registration...');
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

				// create a mock for the project service
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
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					toUpdate: undefined,
					Project: mockProjectService,
					TimeRegistration: mockService,
					date: 20100102
				});

				mockProjectService.flush();

				scope.timeRegistration.company = scope.companies[0];
				scope.timeRegistration.project = scope.companies[0].projects[0];
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[0];

				scope.$close = function() {};
				spyOn(scope, '$close');
			}));

			it('should show a message in the ui', function() {
				
				scope.ok();

				expect(scope.message).toBe('Saving time registration...');
				expect(scope.isBusy).toBe(true);

				mockService.flush();

				expect(scope.message).toBe('');
				expect(scope.isBusy).toBe(false);
			});

			it('should send the time registration to the backend with te correct data', function() {

				scope.timeRegistration.description = 'new description';
				scope.timeRegistration.from = '08:00';
				scope.timeRegistration.to = '10:00';

				scope.ok();
				mockService.flush();

				expect(mockService.idParam.id).toBe(undefined);
				expect(mockService.dataParam.companyId).toBe(1);
				expect(mockService.dataParam.projectId).toBe(1);
				expect(mockService.dataParam.task).toBe('Development');
				expect(mockService.dataParam.description).toBe('new description');
				expect(mockService.dataParam.date).toBe(20100102);
				expect(mockService.dataParam.from).toBe(800);
				expect(mockService.dataParam.to).toBe(1000);
			});

			it('should close the dialog', function() {
				scope.ok();
				mockService.flush();

				expect(scope.$close).toHaveBeenCalledWith(mockService.dataParam);
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
					save: function() {}
				};

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: undefined,
					date: 20100102
				});

				mockProjectService.flush();

				scope.$dismiss = function() { };
				spyOn(scope, '$dismiss');
				spyOn(mockService, 'save');
			}));

			it('should not save the time registration', function() {
				scope.cancel();
				expect(mockService.save).not.toHaveBeenCalled();
			});

			it('should close the dialog', function() {
				scope.cancel();
				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});	

		describe('when the company is changed for a new time registration', function() {
			
			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: undefined,
					date: 20100102
				});

				mockProjectService.flush();

				scope.timeRegistration.company = scope.companies[0];
				scope.timeRegistration.project = scope.companies[0].projects[0];
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[0];

				scope.$apply();

				scope.timeRegistration.company = scope.companies[1];

				scope.$apply();
			}));

			it('should clear the project', function() {
				expect(scope.timeRegistration.project).toBe(null);
			});

			it('should clear the task', function() {
				expect(scope.timeRegistration.task).toBe(null);
			});
		});

		describe('when the project is changed for a new time registration', function() {
			
			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: undefined,
					date: 20100102
				});

				mockProjectService.flush();

				scope.timeRegistration.company = scope.companies[0];
				scope.timeRegistration.project = scope.companies[0].projects[0];
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[0];

				scope.$apply();

				scope.timeRegistration.project = scope.companies[0].projects[1];

				scope.$apply();
			}));

			it('should clear the task', function() {
				expect(scope.timeRegistration.task).toBe(null);
			});
		});

		describe('when the task is changed for a new time registration', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: undefined,
					date: 20100102
				});

				mockProjectService.flush();

				scope.timeRegistration.company = scope.companies[0];
				scope.timeRegistration.project = scope.companies[0].projects[0];
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[1];

				scope.$apply();
			}));			

			it('should update billable if its a new time registration', function() {
				expect(scope.timeRegistration.billable).toBe(true);
			});


			it('should update billable if its a new time registration and the task is changed again', function() {
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[0];
				scope.$apply();
				expect(scope.timeRegistration.billable).toBe(false);
			});
		});		

		describe('when the task is changed for an existing registration', function() {
			
			var scope, 
				controller,
				mockService;			

			beforeEach(inject(function($controller, $rootScope) {

				// pick a task that is billable
				scope = $rootScope.$new();
				controller = $controller('TimeRegistrationDialogController', {
					$scope: scope,
					Project: mockProjectService,
					toUpdate: { id: 2, billable: true, companyId: 1, projectId: 1, description: 'description', task: 'Meeting', from: { numeric: 1000 }, to: { numeric: 1100 } },
					date: 20100102
				});

				mockProjectService.flush();
				scope.$apply();
			}));			

			it('should initially set billable', function() {
				expect(scope.timeRegistration.billable).toBe(true);
			});

			it('should not update billable if its an existing time registration and the task is changed again', function() {
				scope.timeRegistration.task = scope.companies[0].projects[0].tasks[0];
				scope.$apply();
				expect(scope.timeRegistration.billable).toBe(true);
			});
		});	
	});
})();
