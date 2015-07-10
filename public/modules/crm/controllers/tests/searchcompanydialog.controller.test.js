(function() {
	'use strict';

	describe('Search Company Dialog Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('when the controller is created', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('SearchCompanyDialogController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/companies').respond([{ name: 'company1'}, { name: 'company2'}]);
				$httpBackend.flush();
			}));

			it('should store all companies in $scope.companies', function() {
				expect(scope.companies[0].name).toBe('company1');
				expect(scope.companies[1].name).toBe('company2');
			});				
		});	

		describe('when a company is selected and the dialog is confirmed', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {
				
				scope = $rootScope.$new();
				controller = $controller('SearchCompanyDialogController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/companies').respond([{ id: 1, name: 'company1'}, { id: 2, name: 'company2'}]);
				$httpBackend.flush();

				scope.company.id = 1;

				scope.$close = function() { };
				spyOn(scope, '$close');
			}));
			
			it('should close the dialog', function() {
				scope.ok();
				expect(scope.$close).toHaveBeenCalledWith(scope.companies[0]);
			});
		});

		describe('when the dialog is cancelled', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('SearchCompanyDialogController', {
					$scope: scope,
					toUpdate: undefined
				});

				scope.$dismiss = function() { };
				spyOn(scope, '$dismiss');
			}));

			it('should close the dialog', function() {
				scope.cancel();
				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
