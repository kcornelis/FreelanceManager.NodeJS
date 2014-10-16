'use strict';

(function() {
	describe('CompaniesController Unit Tests:', function() {

		var scope, 
			CompaniesController,
			$httpBackend,
			$modal;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope, _$httpBackend_, _$modal_) {
			scope = $rootScope.$new();

			$httpBackend = _$httpBackend_;
			$modal = _$modal_;

			CompaniesController = $controller('CompaniesController', {
				$scope: scope
			});
		}));

		describe('$scope.getAlCompanies', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/companies').respond([{ name: 'company1'}, { name: 'company2'}]);

				scope.getAllCompanies();
				$httpBackend.flush();
			});

			it('should store all companies in $scope.companies', inject(function() {
				expect(scope.companies[0].name).toBe('company1');
				expect(scope.companies[1].name).toBe('company2');
			}));
		});	

		describe('$scope.openComany', function(){

			beforeEach(function(){

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/companies').respond([{ id: 1, name: 'company1'}, { id: 2, name: 'company2'}]);
				scope.getAllCompanies();
				$httpBackend.flush();
			});

			it('should update the ui if a company is updated', function(){
				scope.openCompany();

				dialog.close({ id: 2, name: 'abc' });

				// updated company with id 2
				expect(scope.companies[1].name).toBe('abc');
			});

			it('should update the ui if a company is created', function(){
				scope.openCompany();

				dialog.close({ id: 3, name: 'new' });

				// new company at then end of the list
				expect(scope.companies[2].name).toBe('new');
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
