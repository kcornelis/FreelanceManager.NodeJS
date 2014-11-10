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
			it('should have a default date', function(){
				expect(scope.defaultDate.format('YYYY-MM-DD')).toBe(new moment().format('YYYY-MM-DD'));
			});

			it('should have a default from', function(){
				expect(scope.defaultFrom.format('YYYY-MM-DD')).toBe(new moment().subtract(1, 'month').format('YYYY-MM-DD'));
			});

			it('should have a default to', function(){
				expect(scope.defaultTo.format('YYYY-MM-DD')).toBe(new moment().format('YYYY-MM-DD'));
			});					
		});
	});
})();
