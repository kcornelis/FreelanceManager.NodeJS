'use strict';

(function() {
	describe('RegistrationsController Unit Tests:', function() {

		var scope, 
			RegistrationsController,
			$stateParams,
			$location;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_) {
			scope = $rootScope.$new();

			$stateParams = _$stateParams_;
			$location = _$location_;

			$stateParams.date = '20100120';

			RegistrationsController = $controller('RegistrationsController', {
				$scope: scope
			});

			scope.$apply();
		}));

		describe('initial state', function(){
			it('should have a display date', function(){
				expect(scope.displayDate).toBe('2010-01-20');
			});
		});

		describe('$scope.nextDate', function(){

			beforeEach(function(){
				scope.nextDate();
				scope.$apply();
			});

			it('should select the next date', function(){
				expect($location.path()).toBe('/time/registrations/20100121');
			});

			it('should have a new display date', function(){
				expect(scope.displayDate).toBe('2010-01-21');
			});
		});

		describe('$scope.changeDate', function(){

			beforeEach(function(){
				scope.changeDate('2010-12-01', 'YYYY-MM-DD');
				scope.$apply();
			});

			it('should select the given date', function(){
				expect($location.path()).toBe('/time/registrations/20101201');
			});

			it('should have a new display date', function(){
				expect(scope.displayDate).toBe('2010-12-01');
			});
		});		

		describe('$scope.previousDate', function(){

			beforeEach(function(){
				scope.previousDate();
				scope.$apply();
			});

			it('should select the previous date', function(){
				expect($location.path()).toBe('/time/registrations/20100119');
			});

			it('should have a new display date', function(){
				expect(scope.displayDate).toBe('2010-01-19');
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
