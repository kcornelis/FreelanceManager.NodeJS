'use strict';

(function() {
	describe('TimeRegistrationsController Unit Tests:', function() {

		var scope, 
			TimeRegistrationsController,
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

			TimeRegistrationsController = $controller('TimeRegistrationsController', {
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
					{ description: 'description 1'}, 
					{ description: 'description 2'}]);

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
					{ id: 1, description: 'description 1'}, 
					{ id: 2, description: 'description 2'}]);

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

				// new time registration at then end of the list
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

		describe('$scope.nextDate', function(){

			beforeEach(function(){
				scope.nextDate();
			});

			it('should select the next date', function(){

				expect($location.path()).toBe('/time/20100121');
			});
		});

		describe('$scope.changeDate', function(){

			beforeEach(function(){
				scope.changeDate('2010-12-01', 'YYYY-MM-DD');
			});

			it('should select the given date', function(){

				expect($location.path()).toBe('/time/20101201');
			});
		});		

		describe('$scope.previousDate', function(){

			beforeEach(function(){
				scope.previousDate();
			});

			it('should select the previous date', function(){

				expect($location.path()).toBe('/time/20100119');
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
