'use strict';

(function() {
	describe('TimeController Unit Tests:', function() {

		var scope, 
			TimeController;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope) {
			scope = $rootScope.$new();

			TimeController = $controller('TimeController', {
				$scope: scope
			});
		}));

		describe('initial state', function(){
			it('should store today', function(){
				expect(scope.today.format('YYYY-MM-DD')).toBe(new moment().format('YYYY-MM-DD'));
			});

			it('should have the first of the current month', function(){
				expect(scope.firstOfCurrentMonth.format('YYYY-MM-DD')).toBe(new moment().set('date', 1).format('YYYY-MM-DD'));
			});

			it('should have the last of the current month', function(){
				expect(scope.lastOfCurrentMonth.format('YYYY-MM-DD')).toBe(new moment().set('date', new moment().daysInMonth()).format('YYYY-MM-DD'));
			});					
		});
	});
})();
