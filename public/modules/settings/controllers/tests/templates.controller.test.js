(function() {
	'use strict';
	
	describe('TemplatesController Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('$scope.getAllTemplates', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TemplatesController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/templates').respond([
					{ name: 'template 1', content: 'content 1'}, 
					{ name: 'template 2', content: 'content 2'}]);

				scope.getAllTemplates();
				$httpBackend.flush();
			}));

			it('should store all templates in $scope.templates', inject(function() {
				expect(scope.templates[0].name).toBe('template 1');
				expect(scope.templates[1].name).toBe('template 2');

				expect(scope.templates[0].content).toBe('content 1');
				expect(scope.templates[1].content).toBe('content 2');
			}));
		});	

		describe('$scope.openTemplate with no parameter', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TemplatesController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/templates').respond([
					{ id: 1, name: 'template 1', content: 'content 1'}, 
					{ id: 2, name: 'template 2', content: 'content 2'}]);

				scope.getAllTemplates();
				$httpBackend.flush();

				scope.openTemplate();
			}));

			it('should select no template', function() {
				expect(scope.template.name).toBe(undefined);
				expect(scope.template.content).toBe(undefined);
			});

			it('should set new template to true', function() {
				expect(scope.newTemplate).toBe(true);
			});
		});

		describe('$scope.openTemplate with parameter', function() {

			var scope, 
				controller;
				
			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TemplatesController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/templates').respond([
					{ id: 1, name: 'template 1', content: 'content 1'}, 
					{ id: 2, name: 'template 2', content: 'content 2'}]);

				scope.getAllTemplates();
				$httpBackend.flush();

				scope.openTemplate(_.first(scope.templates));
			}));

			it('should select no template', function() {
				expect(scope.template.id).toBe(1);
			});

			it('should set new template to false', function() {
				expect(scope.newTemplate).toBe(false);
			});
		});

		describe('when an existing template is saved with success', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TemplatesController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/templates').respond([
					{ id: 1, name: 'template 1', content: 'content 1'}, 
					{ id: 2, name: 'template 2', content: 'content 2'}]);

				scope.getAllTemplates();
				$httpBackend.flush();

				scope.openTemplate(_.first(scope.templates));

				$httpBackend.expectPOST('/api/public/templates/1', { id: 1, name: 'updated', content: 'updated content'}).respond(200);

				scope.template.name = 'updated';
				scope.template.content = 'updated content';
				scope.saveTemplate();

				$httpBackend.flush();				
			}));

			it('should send the template to the backend with te correct data', inject(function($httpBackend) {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			}));
		});		

		describe('when a new template is saved with success', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('TemplatesController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/templates').respond([
					{ id: 1, name: 'template 1', content: 'content 1'}, 
					{ id: 2, name: 'template 2', content: 'content 2'}]);

				scope.getAllTemplates();
				$httpBackend.flush();

				scope.openTemplate();

				$httpBackend.expectPOST('/api/public/templates', { name: 'new', content: 'new content'}).respond(200, { id: 3, name: 'new', content: 'new content'});

				scope.template.name = 'new';
				scope.template.content = 'new content';
				scope.saveTemplate();

				$httpBackend.flush();				
			}));

			it('should send the template to the backend with te correct data', inject(function($httpBackend) {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			}));

			it('should add the template to the templates collection', function() {
				expect(_.last(scope.templates).id).toBe(3);
			});

			it('should select the template', function() {
				expect(scope.template.id).toBe(3);
			});

			it('should set new template to false', function() {
				expect(scope.newTemplate).toBe(false);
			});							
		});	
	});
})();
