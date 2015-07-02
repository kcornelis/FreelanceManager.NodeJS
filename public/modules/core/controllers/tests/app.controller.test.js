(function() {
	'use strict';

	describe('Account Info Controller Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope,
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('AppController', {
					$scope: scope
				});
			}));

			it('should set the page title', function() {
				expect(scope.pageTitle()).toBe('Freelance Manager - A demo application in NodeJS');
			});
		});
	});
})();
