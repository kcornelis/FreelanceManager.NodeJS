'use strict';

(function() {
	describe('HeaderController', function() {
		
		//Initialize global variables
		var scope, HeaderController, window, jwtHelper;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function($controller, $rootScope) {
			scope = $rootScope.$new();

			window = {
				sessionStorage: {
					token: 'token'
				}
			};

			jwtHelper = {
				decodeToken: function(token){
					if(token == 'token'){
						return {
							fullName: 'My Name'
						};
					}
					return { };
				}
			};

			HeaderController = $controller('HeaderController', {
				$scope: scope,
				$window: window,
				jwtHelper: jwtHelper
			});
		}));

		it('should contain the full name', function() {
			expect(scope.fullName).toBe('My Name');
		});
	});
})();
