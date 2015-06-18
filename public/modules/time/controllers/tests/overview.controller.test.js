(function() {
	'use strict';
	
	describe('Time Registration Overview Controller Unit Tests:', function() {

		var scope, 
			controller;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function($controller, $rootScope, $stateParams) {
			
			scope = $rootScope.$new();
			$stateParams.date = '20100120';

			controller = $controller('TimeRegistrationOverviewController', {
				$scope: scope
			});

			scope.$apply();
		}));

		describe('initial state', function() {

			it('should have no time registrations', function() {
				expect(scope.hasTimeRegistrations).toBe(false);
			});

			it('should have a display date', function() {
				expect(scope.displayDate).toBe('2010-01-20');
			});
		});

		describe('$scope.nextDate', function() {

			beforeEach(inject(function($state) {
				$state.expectTransitionTo('app.time_overview', { date: '20100121' });

				scope.nextDate();
				scope.$apply();
			}));

			it('should navigate to the time overview state with the new params', inject(function($state) {
				$state.ensureAllTransitionsHappened();
			}));
		});

		describe('$scope.changeDate', function() {

			beforeEach(inject(function($state) {
				$state.expectTransitionTo('app.time_overview', { date: '20101201' });

				scope.changeDate('2010-12-01', 'YYYY-MM-DD');
				scope.$apply();
			}));

			it('should navigate to the time overview state with the new params', inject(function($state) {
				$state.ensureAllTransitionsHappened();
			}));
		});		

		describe('$scope.previousDate', function() {

			beforeEach(inject(function($state) {
				$state.expectTransitionTo('app.time_overview', { date: '20100119' });

				scope.previousDate();
				scope.$apply();
			}));

			it('should navigate to the time overview state with the new params', inject(function($state) {
				$state.ensureAllTransitionsHappened();
			}));
		});

		describe('$scope.refresh', function() {

			beforeEach(inject(function($httpBackend) {

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([
					{ from: { numeric: 2010 }, description: 'description 2'},
					{ from: { numeric: 2009 }, description: 'description 1'}]);

				scope.refresh();
				$httpBackend.flush();
			}));

			it('should store all timeregistrations in $scope.timeregistrations', function() {
				expect(scope.timeRegistrations[0].description).toBe('description 1');
				expect(scope.timeRegistrations[1].description).toBe('description 2');
			});

			if('should refresh $scope.hasTimeRegistrations', function() {
				expect(scope.hasTimeRegistrations).toBe(true);
			});
		});	

		describe('$scope.openTimeRegistration', function() {

			beforeEach(inject(function($httpBackend, $modal) {

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([
					{ id: 1, from: { numeric: 2010 }, description: 'description 1'}, 
					{ id: 2, from: { numeric: 2011 }, description: 'description 2'}]);

				scope.refresh();
				$httpBackend.flush();
			}));

			it('should update the ui if a time registration is updated', function() {
				scope.openTimeRegistration();

				dialog.close({ id: 2, description: 'def' });

				// updated time registration with id 2
				expect(scope.timeRegistrations[1].description).toBe('def');
			});

			it('should update the ui if a time registration is created', function() {
				scope.openTimeRegistration();

				dialog.close({ id: 3, description: 'def' });

				// new time registration at the end of the list
				expect(scope.timeRegistrations[2].description).toBe('def');
			});

			it('should update the ui if a time registration is deleted', function() {
				scope.openTimeRegistration();

				dialog.close({ deleted: 2 });

				// item with id 2 is deleted
				expect(scope.timeRegistrations.length).toBe(1);
				expect(scope.timeRegistrations[0].id).toBe(1);
			});			
		});

		describe('$scope.openTimeRegistration when adding the first time registration', function() {

			beforeEach(inject(function($httpBackend, $modal) {

				sinon.stub($modal, 'open', function() { return dialog; });

				$httpBackend.expectGET('/api/public/timeregistrations/bydate/20100120').respond([]);

				scope.refresh();
				$httpBackend.flush();
			}));

			it('should refresh $scope.hasTimeRegistrations', function() {

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
