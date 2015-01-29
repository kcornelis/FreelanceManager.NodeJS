(function() {
	'use strict';
	
	describe('Account Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		describe('Get all', function(){
			var Account,
				$httpBackend,
				response;

			beforeEach(inject(function(_Account_, _$httpBackend_){
				Account = _Account_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/accounts')
					.respond(200, [{ name: 'account1'}, { name: 'account2'}]);

				response = Account.query();
				$httpBackend.flush();

			}));

			it('should return all accounts', function(){
				expect(response[0].name).toBe('account1');
				expect(response[1].name).toBe('account2');
			});	
		});

		describe('Get by id', function(){
			var Account,
				$httpBackend,
				response;

			beforeEach(inject(function(_Account_, _$httpBackend_){
				Account = _Account_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/accounts/1')
					.respond(200, { name: 'account1'});

				response = Account.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the account', function(){
				expect(response.name).toBe('account1');
			});	
		});	

		describe('Update', function(){
			var Account,
				$httpBackend,
				response;

			beforeEach(inject(function(_Account_, _$httpBackend_){
				Account = _Account_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/accounts/1', { name: 'account1'})
					.respond(200, { name: 'account1'});

				response = Account.save({ id: 1 }, { name: 'account1'});
				$httpBackend.flush();

			}));

			it('should update the account', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function(){
			var Account,
				$httpBackend,
				response;

			beforeEach(inject(function(_Account_, _$httpBackend_){
				Account = _Account_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/accounts', { name: 'account1'})
					.respond(200, { name: 'account1'});

				response = Account.save({ name: 'account1'});
				$httpBackend.flush();

			}));

			it('should create the account', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});				
	});
})();
