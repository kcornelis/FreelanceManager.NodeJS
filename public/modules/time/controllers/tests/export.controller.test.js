// TODO test thisWeek, lastWeek, ...
(function() {
	'use strict';

	describe('ExportController Unit Tests:', function() {

		var scope, 
			ExportController,
			$stateParams,
			$state,
			$modal,
			$httpBackend;

		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function($controller, $rootScope, _$state_, _$stateParams_, _$httpBackend_, _$modal_, $templateCache) {
			
			scope = $rootScope.$new();
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$modal = _$modal_;
			$state = _$state_;

			$stateParams.from = '20100120';
			$stateParams.to = '20100130';

			ExportController = $controller('ExportController', {
				$scope: scope,
				$stateParams: $stateParams
			});

			scope.$apply();
		}));

		describe('initial state', function(){

			it('should have no time registrations', function(){
				expect(scope.hasTimeRegistrations).toBe(false);
			});

			it('should have a from date', function(){
				expect(scope.from.format('YYYY-MM-DD')).toBe('2010-01-20');
			});

			it('should have a to date', function(){
				expect(scope.to.format('YYYY-MM-DD')).toBe('2010-01-30');
			});	

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
				expect($state.current.name).toBe('');
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
				expect($state.current.name).toBe('');
			});
		});	

		describe('$scope.applyDate', function(){

			beforeEach(function(){

				$state.expectTransitionTo("app.time_export", { from: "20101201", to: "20121202"});

				scope.changeFrom('2010-12-01', 'YYYY-MM-DD');
				scope.changeTo('2012-12-02', 'YYYY-MM-DD');
				scope.applyDate();
			});

			it('should navigate the the state with the new params', function(){
				$state.ensureAllTransitionsHappened();
			});
		});	

		describe('$scope.refresh', function(){

			beforeEach(function(){

				$httpBackend.expectGET('/api/public/timeregistrations/byrange/20100120/20100130').respond([
					{ date: { numeric: 20100111 } ,description: 'description 3'},
					{ date: { numeric: 20100110 }, description: 'description 1'}, 
					{ date: { numeric: 20100110 }, description: 'description 2'}]);

				scope.refresh();
				$httpBackend.flush();
			});

			it('should store grouped timeregistrations by date in $scope.timeregistrations', function() {
				expect(scope.timeRegistrations[0].date.numeric).toBe(20100110);
				expect(scope.timeRegistrations[1].date.numeric).toBe(20100111);

				expect(scope.timeRegistrations[0].items[0].description).toBe('description 1');
				expect(scope.timeRegistrations[0].items[1].description).toBe('description 2');
				expect(scope.timeRegistrations[1].items[0].description).toBe('description 3');
			});

			if('should refresh $scope.hasTimeRegistrations', function(){
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
