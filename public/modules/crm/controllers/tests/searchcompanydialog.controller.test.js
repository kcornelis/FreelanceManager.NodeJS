(function() {
	'use strict';

	describe('CompanySearchDialogController Unit Tests:', function() {
		
		//Initialize global variables
		var scope, 
			SearchCompanyDialogController,
			$httpBackend;

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

			beforeEach(inject(function($controller, _$httpBackend_) {
				
				$httpBackend = _$httpBackend_;

				SearchCompanyDialogController = $controller('SearchCompanyDialogController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/companies').respond([{ name: 'company1'}, { name: 'company2'}]);
				$httpBackend.flush();
			}));

			it('should store all companies in $scope.companies', inject(function() {
				expect(scope.companies[0].name).toBe('company1');
				expect(scope.companies[1].name).toBe('company2');
			}));				
		});	

		describe('when a company is selected and the dialog is confirmed', function(){

			beforeEach(inject(function($controller, _$httpBackend_) {
				
				$httpBackend = _$httpBackend_;

				SearchCompanyDialogController = $controller('SearchCompanyDialogController', {
					$scope: scope
				});

				$httpBackend.expectGET('/api/public/companies').respond([{ id: 1, name: 'company1'}, { id: 2, name: 'company2'}]);
				$httpBackend.flush();

				scope.selectedCompany = 1;
			}));
			
			it('should close the dialog', function(){

				scope.ok();

				expect(scope.$close).toHaveBeenCalledWith(scope.companies[0]);
			});
		});

		describe('when the dialog is cancelled', function(){

			beforeEach(inject(function($controller, $rootScope) {

				SearchCompanyDialogController = $controller('SearchCompanyDialogController', {
					$scope: scope,
					toUpdate: undefined
				});
			}));

			it('should close the dialog', function(){
				
				scope.cancel();

				expect(scope.$dismiss).toHaveBeenCalled();
			});
		});				
	});
})();
