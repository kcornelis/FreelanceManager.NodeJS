(function() {
	'use strict';

	describe('AccountInfoController Unit Tests:', function() {

		var scope,
			$httpBackend,
			AccountInfoController,
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

				AccountInfoController = $controller('AccountInfoController', {
					$scope: scope,
					jwtHelper: jwtHelper
				});

				$httpBackend.expectGET('/api/public/accounts/12').respond({ name: 'account12'});
				$httpBackend.flush();
			});

			it('should store the account in $scope.account', inject(function() {
				expect(scope.account.name).toBe('account12');
			}));
		});	

		describe('$scope.save', function(){

			var accountServiceMock;

			beforeEach(function(){

				// create a mock for the acount service
				accountServiceMock = {
					dataParam: null,
					idParam: null,
					get: function(id){
						return { name: 'account' };
					},
					save: function(id, data){
						this.dataParam = data;
						this.idParam = id;
					}
				};

				AccountInfoController = $controller('AccountInfoController', {
					$scope: scope,
					jwtHelper: jwtHelper,
					Account: accountServiceMock
				});

				scope.account.name = 'accountname';
				scope.account.firstName = 'firstname';
				scope.account.lastName = 'lastname';
				scope.account.email = 'email';

				scope.save();
			});

			it('should send the updated account to the backend', inject(function() {

				expect(accountServiceMock.idParam).toBe(12);
				expect(accountServiceMock.dataParam.name).toBe('accountname');
				expect(accountServiceMock.dataParam.firstName).toBe('firstname');
				expect(accountServiceMock.dataParam.lastName).toBe('lastname');
				expect(accountServiceMock.dataParam.email).toBe('email');
			}));
		});	
	});
})();
