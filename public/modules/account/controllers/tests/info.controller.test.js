(function() {
	'use strict';

	describe('Account Info Controller Unit Tests:', function() {

		var jwtHelperMock = {
			decodeToken: function(token) { return { id: 12 }; }
		};
		
		// Load the main application module
		beforeEach(module(fm.config.moduleName));
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
					flush: null,
					get: function(id) {
						return { name: 'account' };
					},
					save: function(id, data, done) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = done;
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
				accountServiceMock.flush();

				expect(accountServiceMock.idParam).toBe(12);
				expect(accountServiceMock.dataParam.name).toBe('accountname');
				expect(accountServiceMock.dataParam.firstName).toBe('firstname');
				expect(accountServiceMock.dataParam.lastName).toBe('lastname');
				expect(accountServiceMock.dataParam.email).toBe('email');
			});

			it('should set is saving to true before the data is send to the backend', function() {
				expect(scope.isSaving).toBe(true);
			});

			it('should set is saving to false after the data is send to the backend', function() {	
				accountServiceMock.flush();
				expect(scope.isSaving).toBe(false);
			});	
		});

		describe('$scope.save with error', function() {

			var scope, 
				controller,
				accountServiceMock;

			beforeEach(inject(function($controller, $rootScope, $httpBackend) {

				accountServiceMock = {
					dataParam: null,
					idParam: null,
					flushWithError: null,
					get: function(id) {
						return { name: 'account' };
					},
					save: function(id, data, done, doneWithError) {
						this.dataParam = data;
						this.idParam = id;
						this.flushWithError = doneWithError;
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

			it('should set is saving to true before the data is send to the backend', function() {
				expect(scope.isSaving).toBe(true);
			});

			it('should set is saving to false after the data is send to the backend', function() {	
				accountServiceMock.flushWithError();
				expect(scope.isSaving).toBe(false);
			});	
		});
	});
})();
