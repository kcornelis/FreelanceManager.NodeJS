'use strict';

(function() {
	describe('ProjectsController Unit Tests:', function() {

		var scope, 
			ProjectsController,
			$httpBackend,
			$modal;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

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

		describe('$scope.openComany', function(){

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