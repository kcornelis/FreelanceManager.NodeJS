//'use strict';

(function() {
	describe('Company Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		describe('Get all', function(){
			var Company,
				$httpBackend,
				response;

			beforeEach(inject(function(_Company_, _$httpBackend_){
				Company = _Company_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/companies')
					.respond(200, [{ name: 'company1'}, { name: 'company2'}]);

				response = Company.query();
				$httpBackend.flush();

			}));

			it('should return all companies', function(){
				expect(response[0].name).toBe('company1');
				expect(response[1].name).toBe('company2');
			});	
		});

		describe('Get by id', function(){
			var Company,
				$httpBackend,
				response;

			beforeEach(inject(function(_Company_, _$httpBackend_){
				Company = _Company_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/companies/1')
					.respond(200, { name: 'company1'});

				response = Company.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the company', function(){
				expect(response.name).toBe('company1');
			});	
		});	

		describe('Update', function(){
			var Company,
				$httpBackend,
				response;

			beforeEach(inject(function(_Company_, _$httpBackend_){
				Company = _Company_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/companies/1', { name: 'company1'})
					.respond(200, { name: 'company1'});

				response = Company.save({ id: 1 }, { name: 'company1'});
				$httpBackend.flush();

			}));

			it('should update the company', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function(){
			var Company,
				$httpBackend,
				response;

			beforeEach(inject(function(_Company_, _$httpBackend_){
				Company = _Company_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/companies', { name: 'company1'})
					.respond(200, { name: 'company1'});

				response = Company.save({ name: 'company1'});
				$httpBackend.flush();

			}));

			it('should create the company', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});				
	});
})();
