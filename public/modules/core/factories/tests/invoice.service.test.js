(function() {
	'use strict';
	
	describe('Invoice Factory Unit Tests:', function() {

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		describe('Get all', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices')
					.respond(200, [{ name: 'invoice1'}, { name: 'invoice2'}]);

				response = Invoice.query();
				$httpBackend.flush();

			}));

			it('should return all invoices', function() {
				expect(response[0].name).toBe('invoice1');
				expect(response[1].name).toBe('invoice2');
			});	
		});

		describe('Get by id', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices/1')
					.respond(200, { name: 'invoice1'});

				response = Invoice.get({ id: 1 });
				$httpBackend.flush();

			}));

			it('should return the invoice', function() {
				expect(response.name).toBe('invoice1');
			});	
		});	

		describe('Get by date', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices/bydate/20140101/20140110')
					.respond(200, [{ description: 'invoice 1'}, { description: 'invoice 2'}]);

				response = Invoice.bydate({ from: 20140101, to: 20140110 });
				$httpBackend.flush();

			}));

			it('should return all invoices for the given date', function() {
				expect(response[0].description).toBe('invoice 1');
				expect(response[1].description).toBe('invoice 2');
			});	
		});		

		describe('Update', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/invoices/1', { name: 'invoice1'})
					.respond(200, { name: 'invoice1'});

				response = Invoice.save({ id: 1 }, { name: 'invoice1'});
				$httpBackend.flush();

			}));

			it('should update the invoice', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});		

		describe('Create', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/invoices', { name: 'invoice1'})
					.respond(200, { name: 'invoice1'});

				response = Invoice.save({ name: 'invoice1'});
				$httpBackend.flush();

			}));

			it('should create the invoice', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});	

		describe('Preview', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/api/public/invoices/preview', { name: 'invoice1'})
					.respond(200, { name: 'invoice1'});

				response = Invoice.preview({ name: 'invoice1'});
				$httpBackend.flush();

			}));

			it('should return a preview of the invoice', function() {
				$httpBackend.verifyNoOutstandingExpectation();
      			$httpBackend.verifyNoOutstandingRequest();
			});	
		});

		describe('Get info for period per customer', function() {
			
			var Invoice,
				$httpBackend,
				response;

			beforeEach(inject(function(_Invoice_, _$httpBackend_) {
				Invoice = _Invoice_;
				$httpBackend = _$httpBackend_;

				$httpBackend.expectGET('/api/public/invoices/getinfoforperiodpercustomer/20140101/20140110')
					.respond(200, [ { customerNumber: 1 }, { customerNumber: 2 } ]);

				response = Invoice.getinfoforperiodpercustomer({ from: 20140101, to: 20140110 });
				$httpBackend.flush();
			}));

			it('should return invoice info for the given date range', function() {
				expect(response[0].customerNumber).toBe(1);
				expect(response[1].customerNumber).toBe(2);
			});
		});
	});
})();
