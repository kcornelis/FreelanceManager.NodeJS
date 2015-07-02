(function() {
	'use strict';

	describe('Account Password Controller Unit Tests:', function() {

		var jwtHelper = {
			decodeToken: function(token) { return { id: 12 }; }
		};

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('initialization', function() {

			var scope, 
				controller;

			beforeEach(inject(function($controller, $rootScope) {

				scope = $rootScope.$new();
				controller = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper
				});
			}));

			it('should create an empty oldPassword', function() {
				expect(scope.oldPassword).toBe('');
			});

			it('should create an empty newPassword', function() {
				expect(scope.newPassword).toBe('');
			});

			it('should create an empty newPasswordConfirm', function() {
				expect(scope.newPasswordConfirm).toBe('');
			});								
		});	

		describe('$scope.save', function() {

			var scope, 
				controller,
				accountServiceMock;

			beforeEach(inject(function($controller, $rootScope) {

				accountServiceMock = {
					dataParam: null,
					idParam: null,
					flush: null,
					changePassword: function(id, data, done) {
						this.dataParam = data;
						this.idParam = id;
						this.flush = done;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper,
					Account: accountServiceMock
				});

				scope.oldPassword = 'abc';
				scope.newPassword = 'xyz';
				scope.accountPasswordForm = {
					pristineCalled: false,
					$setPristine: function() { this.pristineCalled = true; }
				};

				scope.save();
			}));

			it('should send the old and the new password to the backend', function() {
				expect(accountServiceMock.idParam.id).toBe(12);
				expect(accountServiceMock.dataParam.oldPassword).toBe('abc');
				expect(accountServiceMock.dataParam.newPassword).toBe('xyz');
			});

			it('should set is saving to true before the data is send to the backend', function() {
				expect(scope.isSaving).toBe(true);
			});				

			it('should set is saving to false after the data is send to the backend', function() {	
				accountServiceMock.flush();
				expect(scope.isSaving).toBe(false);
			});		

			it('should set the form to its initial state after the data is send to the backend', function() {	
				accountServiceMock.flush();
				expect(scope.accountPasswordForm.pristineCalled).toBe(true);
			});	

			it('should reset the scope variables after the data is send to the backend', function() {	
				accountServiceMock.flush();
				expect(scope.oldPassword).toBe('');
				expect(scope.newPassword).toBe('');
				expect(scope.newPasswordConfirm).toBe('');
			});					
		});	

		describe('$scope.save with error', function() {

			var scope, 
				controller,
				accountServiceMock;

			beforeEach(inject(function($controller, $rootScope) {

				accountServiceMock = {
					dataParam: null,
					idParam: null,
					flushWithError: null,
					changePassword: function(id, data, done, error) {
						this.dataParam = data;
						this.idParam = id;
						this.flushWithError = error;
					}
				};

				scope = $rootScope.$new();
				controller = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper,
					Account: accountServiceMock
				});

				scope.oldPassword = 'abc';
				scope.newPassword = 'xyz';
				scope.newPasswordConfirm = 'xyz';

				scope.accountPasswordForm = {
					pristineCalled: false,
					$setPristine: function() { this.pristineCalled = true; }
				};

				scope.save();
			}));

			it('should set has error to false before the data is send to the backend', function() {
				expect(scope.hasError).toBe(false);
			});				

			it('should set is has error to true after the data is send to the backend', function() {	
				accountServiceMock.flushWithError();
				expect(scope.hasError).toBe(true);
			});		

			it('should set is saving to false after the data is send to the backend', function() {	
				accountServiceMock.flushWithError();
				expect(scope.isSaving).toBe(false);
			});				

			it('should not set the form to its initial state after the data is send to the backend', function() {	
				accountServiceMock.flushWithError();
				expect(scope.accountPasswordForm.pristineCalled).toBe(false);
			});	

			it('should not reset the scope variables after the data is send to the backend', function() {	
				accountServiceMock.flushWithError();
				expect(scope.oldPassword).toBe('abc');
				expect(scope.newPassword).toBe('xyz');
				expect(scope.newPasswordConfirm).toBe('xyz');
			});					
		});
	});
})();
