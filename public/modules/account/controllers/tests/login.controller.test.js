(function() {
	'use strict';

	describe('Account Login Controller Unit Tests:', function() {
		
		var jwtHelperMock = {
			decodeToken: function(token) { return { fullName: 'name' + token }; }
		};
		
		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('$scope.submit with valid credentials', function() {

			var scope, 
				controller;
			
			beforeEach(inject(function($controller, $rootScope, $httpBackend) {
				
				scope = $rootScope.$new();
				controller = $controller('AccountLoginController', {
					$scope: scope,
					jwtHelper: jwtHelperMock
				});

				scope.user.email = 'abc@def.com';
				scope.user.password = '123';

				$httpBackend.expectPOST('/security/authenticate', scope.user).respond({ token: 'authtoken' });

				scope.submit();
				$httpBackend.flush();
			}));

			it('should store a token in the local storage', inject(function($window) {
				expect($window.localStorage.token).toBe('authtoken');
			}));	

			it('should store the user name in the local storage', inject(function($window) {
				expect($window.localStorage.user).toBe('nameauthtoken'); // jwt helper mock returns name+token as the fullname
			}));		

			it('should redirect to the home page', inject(function($location) {
				expect($location.path()).toBe('/');
			}));
		});

		describe('$scope.submit with invalid credentials', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('AccountLoginController', {
					$scope: scope,
					jwtHelper: jwtHelperMock
				});

				scope.user.email = 'abc@def.com';
				scope.user.password = '123';

				$httpBackend.expectPOST('/security/authenticate', scope.user).respond(401, 'Invalid email or password');

				scope.submit();
				$httpBackend.flush();
			}));

			it('should not store a token in the local storage', inject(function($window) {
				expect($window.localStorage.token).toBe(undefined);
			}));	

			it('should not store the user name in the local storage', inject(function($window) {
				expect($window.localStorage.user).toBe(undefined);
			}));	

			it('should show an error', function() {
				expect(scope.error).toBe('Invalid email or password');
			});

			it('should clear the password', function() {
				expect(scope.user.password).toBe('');
			});
		});
	});
})();
