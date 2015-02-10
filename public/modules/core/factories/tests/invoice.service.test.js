(function() {
	'use strict';
	
	describe('Invoice Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		describe('Get all', function(){
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_){
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices')
					.respond(200, [{ name: 'invoice1'}, { name: 'invoice2'}]);

				response = Invoice.query();
				$httpBackend.flush();

			}));

			it('should return all invoices', function(){
				expect(response[0].name).toBe('invoice1');
				expect(response[1].name).toBe('invoice2');
			});	
		});

		describe('Get by id', function(){
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_){
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices/1')
					.respond(200, { name: 'invoice1'});

				response = Invoice.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the invoice', function(){
				expect(response.name).toBe('invoice1');
			});	
		});	

		describe('Update', function(){
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_){
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/invoices/1', { name: 'invoice1'})
					.respond(200, { name: 'invoice1'});

				response = Invoice.save({ id: 1 }, { name: 'invoice1'});
				$httpBackend.flush();

			}));

			it('should update the invoice', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function(){
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_){
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/invoices', { name: 'invoice1'})
					.respond(200, { name: 'invoice1'});

				response = Invoice.save({ name: 'invoice1'});
				$httpBackend.flush();

			}));

			it('should create the invoice', function(){
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});				
	});
})();
