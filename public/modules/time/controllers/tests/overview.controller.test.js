'use strict';

// TODO test thisWeek, lastWeek, ...

(function() {
	describe('OverviewController Unit Tests:', function() {

		var scope, 
			OverviewController,
			$stateParams,
			$location;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_) {
			scope = $rootScope.$new();

			$stateParams = _$stateParams_;
			$location = _$location_;

			$stateParams.from = '20100120';
			$stateParams.to = '20100130';

			OverviewController = $controller('OverviewController', {
				$scope: scope
			});

			$location.path('/time/overview/20100120/20100130');

			scope.$apply();
		}));

		describe('initial state', function(){
			it('should have a display from date', function(){
				expect(scope.displayFrom).toBe('2010-01-20');
			});

			it('should have a display to date', function(){
				expect(scope.displayTo).toBe('2010-01-30');
			});			
		});

		describe('$scope.changeFrom', function(){

			beforeEach(function(){
				scope.changeFrom('2010-12-01', 'YYYY-MM-DD');
				scope.$apply();
			});

			it('should have a new display date', function(){
				expect(scope.displayFrom).toBe('2010-12-01');
			});

			it('should not be applied', function(){
				expect($location.path()).toBe('/time/overview/20100120/20100130');
			});
		});		

		describe('$scope.changeTo', function(){

			beforeEach(function(){
				scope.changeTo('2012-12-01', 'YYYY-MM-DD');
				scope.$apply();
			});

			it('should have a new display date', function(){
				expect(scope.displayTo).toBe('2012-12-01');
			});

			it('should not be applied', function(){
				expect($location.path()).toBe('/time/overview/20100120/20100130');
			});
		});	

		describe('$scope.applyDate', function(){

			beforeEach(function(){
				scope.changeFrom('2010-12-01', 'YYYY-MM-DD');
				scope.changeTo('2012-12-01', 'YYYY-MM-DD');
				scope.applyDate();
				scope.$apply();
			});

			it('should refresh the overview', function(){
				expect($location.path()).toBe('/time/overview/20101201/20121201');
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
