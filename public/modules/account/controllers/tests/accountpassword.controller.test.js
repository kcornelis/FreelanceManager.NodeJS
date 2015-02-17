(function() {
	'use strict';

	describe('AccountPasswordController Unit Tests:', function() {

		var scope,
			$httpBackend,
			AccountPasswordController,
			jwtHelper,
			$controller;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function(_$controller_, $rootScope, _$httpBackend_) {
			scope = $rootScope.$new();
			$httpBackend = _$httpBackend_;
			$controller = _$controller_;

			jwtHelper = {
				decodeToken: function(token){ return { id: 12 }; }
			};
		}));

		describe('initialization', function(){

			beforeEach(function(){

				AccountPasswordController = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper
				});
			});

			it('should make an empty oldPassword', function() {
				expect(scope.oldPassword).toBe('');
			});

			it('should make an empty newPassword', function() {
				expect(scope.newPassword).toBe('');
			});

			it('should make an empty newPasswordConfirm', function() {
				expect(scope.newPasswordConfirm).toBe('');
			});								
		});	

		describe('$scope.save', function(){

			var accountServiceMock;

			beforeEach(function(){

				// create a mock for the acount service
				accountServiceMock = {
					dataParam: null,
					idParam: null,
					flush: null,
					changePassword: function(id, data, done){
						this.dataParam = data;
						this.idParam = id;
						this.flush = done;
					}
				};

				AccountPasswordController = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper,
					Account: accountServiceMock
				});

				scope.oldPassword = 'abc';
				scope.newPassword = 'xyz';
				scope.accountPasswordForm = {
					pristineCalled: false,
					$setPristine: function(){ this.pristineCalled = true; }
				};

				scope.save();
			});

			it('should send the old and the new password to the backend', function() {
			
				expect(accountServiceMock.idParam.id).toBe(12);
				expect(accountServiceMock.dataParam.oldPassword).toBe('abc');
				expect(accountServiceMock.dataParam.newPassword).toBe('xyz');
			});

			it('should set is saving to true before the data is send to the backend', function(){
				expect(scope.isSaving).toBe(true);
			});				

			it('should set is saving to false after the data is send to the backend', function(){	
				
				accountServiceMock.flush();
				expect(scope.isSaving).toBe(false);
			});		

			it('should set the form to its initial state after the data is send to the backend', function(){	
				
				accountServiceMock.flush();
				expect(scope.accountPasswordForm.pristineCalled).toBe(true);
			});	

			it('should reset the scope variables after the data is send to the backend', function(){	
				
				accountServiceMock.flush();
				expect(scope.oldPassword).toBe('');
				expect(scope.newPassword).toBe('');
				expect(scope.newPasswordConfirm).toBe('');
			});					
		});	

		describe('$scope.save with error', function(){

			var accountServiceMock;

			beforeEach(function(){

				// create a mock for the acount service
				accountServiceMock = {
					dataParam: null,
					idParam: null,
					flushWithError: null,
					changePassword: function(id, data, done, error){
						this.dataParam = data;
						this.idParam = id;
						this.flushWithError = error;
					}
				};

				AccountPasswordController = $controller('AccountPasswordController', {
					$scope: scope,
					jwtHelper: jwtHelper,
					Account: accountServiceMock
				});

				scope.oldPassword = 'abc';
				scope.newPassword = 'xyz';
				scope.newPasswordConfirm = 'xyz';

				scope.accountPasswordForm = {
					pristineCalled: false,
					$setPristine: function(){ this.pristineCalled = true; }
				};

				scope.save();
			});

			it('should set has error to false before the data is send to the backend', function(){
				expect(scope.hasError).toBe(false);
			});				

			it('should set is has error to true after the data is send to the backend', function(){	
				
				accountServiceMock.flushWithError();
				expect(scope.hasError).toBe(true);
			});		

			it('should set is saving to false after the data is send to the backend', function(){	
				
				accountServiceMock.flushWithError();
				expect(scope.isSaving).toBe(false);
			});				

			it('should not set the form to its initial state after the data is send to the backend', function(){	
				
				accountServiceMock.flushWithError();
				expect(scope.accountPasswordForm.pristineCalled).toBe(false);
			});	

			it('should not reset the scope variables after the data is send to the backend', function(){	
				
				accountServiceMock.flushWithError();
				expect(scope.oldPassword).toBe('abc');
				expect(scope.newPassword).toBe('xyz');
				expect(scope.newPasswordConfirm).toBe('xyz');
			});					
		});	
	});
})();
