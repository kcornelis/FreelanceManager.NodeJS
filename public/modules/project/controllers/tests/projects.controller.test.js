(function() {
	'use strict';
	
	describe('ProjectsController Unit Tests:', function() {

		var scope, 
			ProjectsController,
			$httpBackend,
			$modal;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function($controller, $rootScope, _$httpBackend_, _$modal_) {
			scope = $rootScope.$new();

			$httpBackend = _$httpBackend_;
			$modal = _$modal_;

			ProjectsController = $controller('ProjectsController', {
				$scope: scope
			});
		}));

		describe('$scope.getAllProjects', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/projects').respond([
					{ name: 'project 1', description: 'description 1'}, 
					{ name: 'project 2', description: 'description 2'}]);

				scope.getAllProjects();
				$httpBackend.flush();
			});

			it('should store all projects in $scope.projects', inject(function() {
				expect(scope.projects[0].name).toBe('project 1');
				expect(scope.projects[1].name).toBe('project 2');

				expect(scope.projects[0].description).toBe('description 1');
				expect(scope.projects[1].description).toBe('description 2');
			}));
		});	

		describe('$scope.openProject', function(){

			beforeEach(function(){

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project 1', description: 'description 1'}, 
					{ id: 2, name: 'project 2', description: 'description 2'}]);

				scope.getAllProjects();
				$httpBackend.flush();
			});

			it('should update the ui if a project is updated', function(){
				scope.openProject();

				dialog.close({ id: 2, name: 'abc', description: 'def' });

				// updated project with id 2
				expect(scope.projects[1].name).toBe('abc');
				expect(scope.projects[1].description).toBe('def');
			});

			it('should update the ui if a project is created', function(){
				scope.openProject();

				dialog.close({ id: 3, name: 'abc', description: 'def' });

				// new project at then end of the list
				expect(scope.projects[2].name).toBe('abc');
				expect(scope.projects[2].description).toBe('def');
			});
		});

		describe('$scope.hideProject', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project 1', description: 'description 1', hidden: false }, 
					{ id: 2, name: 'project 2', description: 'description 2', hidden: false }]);

				scope.getAllProjects();
				$httpBackend.flush();


				$httpBackend.expectPOST('/api/public/projects/1/hide').respond(
					{ id: 1, name: 'project 1', description: 'description 1', hidden: true });

				scope.hideProject(scope.projects[0]);
				$httpBackend.flush();
			});

			it('should send the request to the backend', function(){
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});

			it('should mark the selected project as hidden', inject(function() {
				expect(scope.projects[0].hidden).toBe(true);
			}));
		});	

		describe('$scope.unhideProject', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project 1', description: 'description 1', hidden: true }, 
					{ id: 2, name: 'project 2', description: 'description 2', hidden: true }]);

				scope.getAllProjects();
				$httpBackend.flush();


				$httpBackend.expectPOST('/api/public/projects/1/unhide').respond(
					{ id: 1, name: 'project 1', description: 'description 1', hidden: false });

				scope.unhideProject(scope.projects[0]);
				$httpBackend.flush();
			});

			it('should send the request to the backend', function(){
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});

			it('should mark the selected project as unhidden', inject(function() {
				expect(scope.projects[0].hidden).toBe(false);
			}));
		});	

		describe('$scope.openProjectTasks', function(){

			beforeEach(function(){

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/projects').respond([
					{ id: 1, name: 'project 1', description: 'description 1', tasks: [
						{ name: 'Development', defaultRateInCents: 50 },
						{ name: 'Sleeping', defaultRateInCents: 0 }
					]}, 
					{ id: 2, name: 'project 2', description: 'description 2', tasks: [
						{ name: 'Development', defaultRateInCents: 50 },
						{ name: 'Sleeping', defaultRateInCents: 0 }
					]}]);

				scope.getAllProjects();
				$httpBackend.flush();
			});

			it('should update the project if its updated', function(){
				scope.openProjectTasks();

				dialog.close({ id: 1, name: 'project 1', description: 'description 1', tasks: [
						{ name: 'Develepment', defaultRateInCents: 40 },
						{ name: 'Sleeping', defaultRateInCents: 0 }
					]});

				expect(scope.projects[0].tasks[0].defaultRateInCents).toBe(40);
			});
		});				

		var dialog = {
		    result: {
		        then: function(confirmCallback, cancelCallback) {
		            this.confirmCallBack = confirmCallback;
		            this.cancelCallback = cancelCallback;
		        }
		    },
		    close: function( item ) {
		        this.result.confirmCallBack(item);
		    },
		    dismiss: function( type ) {
		        this.result.cancelCallback(type);
		    }
		};
	});
})();
