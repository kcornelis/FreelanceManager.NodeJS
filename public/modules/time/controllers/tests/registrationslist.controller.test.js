'use strict';

(function() {
	describe('RegistrationsListController Unit Tests:', function() {

		var scope, 
			RegistrationsListController,
			$httpBackend,
			$modal,
			$stateParams,
			$location;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _$modal_) {
			scope = $rootScope.$new();

			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$modal = _$modal_;
			$location = _$location_;

			$stateParams.date = '20100120';

			RegistrationsListController = $controller('RegistrationsListController', {
				$scope: scope
			});
		}));

		describe('initial state', function(){

			it('should have no time registrations', function(){
				expect(scope.hasTimeRegistrations).toBe(false);
			});
		});

		describe('$scope.refresh', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([
					{ from: { numeric: 2010 }, description: 'description 2'},
					{ from: { numeric: 2009 }, description: 'description 1'}]);

				scope.refresh();
				$httpBackend.flush();
			});

			it('should store all timeregistrations in $scope.timeregistrations', function() {
				expect(scope.timeRegistrations[0].description).toBe('description 1');
				expect(scope.timeRegistrations[1].description).toBe('description 2');
			});

			if('should refresh $scope.hasTimeRegistrations', function(){
				expect(scope.hasTimeRegistrations).toBe(true);
			});
		});	

		describe('$scope.openTimeRegistration', function(){

			beforeEach(function(){

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([
					{ id: 1, from: { numeric: 2010 }, description: 'description 1'}, 
					{ id: 2, from: { numeric: 2011 }, description: 'description 2'}]);

				scope.refresh();
				$httpBackend.flush();
			});

			it('should update the ui if a time registration is updated', function(){
				scope.openTimeRegistration();

				dialog.close({ id: 2, description: 'def' });

				// updated time registration with id 2
				expect(scope.timeRegistrations[1].description).toBe('def');
			});

			it('should update the ui if a time registration is created', function(){
				scope.openTimeRegistration();

				dialog.close({ id: 3, description: 'def' });

				// new time registration at the end of the list
				expect(scope.timeRegistrations[2].description).toBe('def');
			});
		});

		describe('$scope.openTimeRegistration', function(){

			beforeEach(function(){

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([]);

				scope.refresh();
				$httpBackend.flush();
			});

			it('should refresh $scope.hasTimeRegistrations', function(){

				expect(scope.hasTimeRegistrations).toBe(false);

				scope.openTimeRegistration();

				dialog.close({ id: 1, description: 'def' });

				expect(scope.hasTimeRegistrations).toBe(true);
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
