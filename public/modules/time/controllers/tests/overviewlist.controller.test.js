'use strict';

(function() {
	describe('OverviewListController Unit Tests:', function() {

		var scope, 
			OverviewListController,
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

			$stateParams.from = '20100120';
			$stateParams.to = '20100130';

			OverviewListController = $controller('OverviewListController', {
				$scope: scope
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
	});
})();
