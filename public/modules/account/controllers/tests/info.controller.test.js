(function() {
	'use strict';

	describe('Account Info Controller Unit Tests:', function() {

		var jwtHelperMock = {
			decodeToken: function(token) { return { id: 12 }; }
		};
		
		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				scope = $rootScope.$new();
				controller = $controller('AccountInfoController', {
					$scope: scope,
					jwtHelper: jwtHelperMock
				});

				$httpBackend.expectGET('/api/public/accounts/12').respond({ name: 'account12'});
				$httpBackend.flush();
			}));

			it('should store the account in $scope.account', function() {
				expect(scope.account.name).toBe('account12');
			});
		});	

		describe('$scope.save', function() {

			var scope, 
				controller,
				accountServiceMock;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				accountServiceMock = {
					dataParam: null,
					idParam: null,
					get: function(id) {
						return { name: 'account' };
					},
					save: function(id, data) {
						this.dataParam = data;
						this.idParam = id;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('AccountInfoController', {
					$scope: scope,
					jwtHelper: jwtHelperMock,
					Account: accountServiceMock
				});

				scope.account.name = 'accountname';
				scope.account.firstName = 'firstname';
				scope.account.lastName = 'lastname';
				scope.account.email = 'email';

				scope.save();
			}));

			it('should send the updated account to the backend', function() {

				expect(accountServiceMock.idParam).toBe(12);
				expect(accountServiceMock.dataParam.name).toBe('accountname');
				expect(accountServiceMock.dataParam.firstName).toBe('firstname');
				expect(accountServiceMock.dataParam.lastName).toBe('lastname');
				expect(accountServiceMock.dataParam.email).toBe('email');
			});
		});
	});
})();
