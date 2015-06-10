(function() {
	'use strict';

	describe('AuthenticateController Unit Tests:', function() {
		
		//Initialize global variables
		var scope, 
			AuthenticateController,
			$httpBackend,
			$window,
			$location,
			jwtHelper;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function($controller, $rootScope, _$httpBackend_, _$window_, _$location_) {
			
			scope = $rootScope.$new();
			$httpBackend = _$httpBackend_;
			$window = _$window_;
			$location = _$location_;
			jwtHelper = {
				decodeToken: function(token){ return { fullName: 'name' + token }; }
			};

			AuthenticateController = $controller('AuthenticateController', {
				$scope: scope,
				jwtHelper: jwtHelper
			});
		}));

		describe('$scope.submit with valid credentials', function(){

			beforeEach(function(){
				scope.user.email = 'abc@def.com';
				scope.user.password = '123';

				$httpBackend.expectPOST('/security/authenticate', scope.user).respond({ token: 'authtoken' });

				scope.submit();
				$httpBackend.flush();
			});

			it('should store a token in the local storage', inject(function() {
				expect($window.localStorage.token).toBe('authtoken');
			}));	

			it('should store the user name in the local storage', inject(function() {
				expect($window.localStorage.user).toBe('nameauthtoken'); // jwt helper mock returns name+token as the fullname
			}));		

			it('should redirect to the home page', inject(function() {
				expect($location.path()).toBe('/');
			}));
		});

		describe('$scope.submit with invalid credentials', function(){

			beforeEach(function(){
				scope.user.email = 'abc@def.com';
				scope.user.password = '123';

				$httpBackend.expectPOST('/security/authenticate', scope.user).respond(401, 'Invalid email or password');

				scope.submit();
				$httpBackend.flush();
			});

			it('should not store a token in the local storage', inject(function() {
				expect($window.localStorage.token).toBe(undefined);
			}));	

			it('should not store the user name in the local storage', inject(function() {
				expect($window.localStorage.user).toBe(undefined);
			}));	

			it('should show an error', inject(function() {
				expect(scope.error).toBe('Invalid email or password');
			}));

			it('should clear the password', inject(function() {
				expect(scope.user.password).toBe('');
			}));
		});		
	});
})();
