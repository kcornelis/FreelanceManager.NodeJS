'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/invoice'),
	config = require_config(),
	uuid = require('node-uuid'),
	Invoice = require('mongoose').model('Invoice'),
	testdata = require_infrastructure('testdata');


describe('Public API: Invoice Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When a invoice is requested by id by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/invoices/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a invoice is requested by id', function() {

		var response;
		var body;
		var invoice;

		before(function(done) {


			invoice = Invoice.create(testdata.normalAccountId, '20140301', 20140331, 20140430);

			invoice.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');

			invoice.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice.replaceLines([{
				description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
			}]);

			async.series([
				function(done) {

					invoice.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.get('/api/public/invoices/' + invoice.id)
						.set('Authorization', testdata.normalAccountToken)
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;
							done();
						});
				}
			], done);
		});
		
		it('should return the id of the invoice', function() {
			body.id.should.eql(invoice.id);
		});

		it('should return the number of the invoice', function() {

			body.number.should.eql('20140301');
		});			

		it('should return the date of the invoice', function() {

			body.date.numeric.should.eql(20140331);
			body.date.year.should.eql(2014);
			body.date.month.should.eql(3);
			body.date.day.should.eql(31);
		});	

		it('should return the credit term of the invoice', function() {

			body.creditTerm.numeric.should.eql(20140430);
			body.creditTerm.year.should.eql(2014);
			body.creditTerm.month.should.eql(4);
			body.creditTerm.day.should.eql(30);
		});	

		it('should return the template of the invoice', function() {

			body.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should return info about the receiver of the invoice', function() {

			body.customer.name.should.eql('John BVBA');
			body.customer.vatNumber.should.eql('BE12345678');
			body.customer.number.should.eql('100');

			body.customer.address.line1.should.eql('Kerkstraat');
			body.customer.address.postalcode.should.eql('9999');
			body.customer.address.city.should.eql('Brussel');
		});	

		it('should return the lines of the invoice', function() {

			body.lines[0].description.should.eql('item 1');
			body.lines[0].quantity.should.eql(2);
			body.lines[0].priceInCents.should.eql(100);
			body.lines[0].price.should.eql(1);
			body.lines[0].vatPercentage.should.eql(21);
			body.lines[0].totalInCents.should.eql(200);
			body.lines[0].total.should.eql(2);
		});	

		it('should return the sub total of the invoice in cents', function() {

			body.subTotalInCents.should.eql(200);
		});	

		it('should return the sub total of the invoice', function() {

			body.subTotal.should.eql(2);
		});			

		it('should return the vat per percentage of the invoice', function() {

			body.vatPerPercentages[0].vatPercentage.should.eql(21);
			body.vatPerPercentages[0].totalVatInCents.should.eql(42);
			body.vatPerPercentages[0].totalVat.should.eql(0.42);
		});	

		it('should return the total vat of the invoice in cents', function() {

			body.totalVatInCents.should.eql(42);
		});	

		it('should return the total vat of the invoice', function() {

			body.totalVat.should.eql(0.42);
		});			

		it('should return the total of the invoice in cents', function() {

			body.totalInCents.should.eql(242);
		});	

		it('should return the total of the invoice', function() {

			body.total.should.eql(2.42);
		});	
	});

	describe('When a invoice is requested by id by another tenant', function() {

		var response;
		var body;
		var invoice;

		before(function(done) {

			
			invoice = Invoice.create(uuid.v1(), '20140301', 20140331, 20140430);

			invoice.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');

			invoice.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice.replaceLines([{
				description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
			}]);
			
			async.series([
				function(done) {

					invoice.save(done);
				}
			], done);
		});
		
		it('should not return the invoice', function(done) {
			request('http://localhost:' + config.port)
				.get('/api/public/invoices/' + invoice.id)
				.set('Authorization', testdata.normalAccountToken)
				.expect(404)
				.expect('Content-Type', /html/)
				.end(done);
		});
	});

	/**
	 * Get all invoices
	 */
	describe('When all invoices are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/invoices')
				.expect(401)
				.end(done);
		});
	});

	describe('When all invoices are requested', function() {

		var response;
		var body;

		var invoice1;
		var invoice2;
		var invoice3;

		before(function(done) {


		 	invoice1 = Invoice.create(testdata.normalAccountId, '20140301', 20140331, 20140430);
			invoice1.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice1.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice2 = Invoice.create(testdata.normalAccountId, '20140302', 20140331, 20140430);
			invoice2.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice2.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice3 = Invoice.create(uuid.v1(), '20140303', 20140331, 20140430);
			invoice3.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice3.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	
			
			async.series([
				function(done) {

					invoice1.save(done);
				},
				function(done) {

					invoice2.save(done);
				},
				function(done) {

					invoice3.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/invoices')
						.set('Authorization', testdata.normalAccountToken)
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;
							done();
						});
				}
			], done);
		});

		it('should return a collection with the first invoice', function() {
			_.where(body, { id: invoice1.id }).length.should.eql(1);
			_.where(body, { id: invoice1.id })[0].number.should.eql('20140301');
		});

		it('should return a collection with the second invoice', function() {
			_.where(body, { id: invoice2.id }).length.should.eql(1);
			_.where(body, { id: invoice2.id })[0].number.should.eql('20140302');
		});

		it('should not return invoices from another tenant', function() {
			_.where(body, { id: invoice3.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all invoices by range
	 */
	describe('When invoices are requested by range by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/invoices/byrange/20100202/20100211')
				.expect(401)
				.end(done);
		});
	});

	describe('When invoices are requested by range', function() {

		var response;
		var body;

		var invoice1;
		var invoice2;
		var invoice3;
		var invoice4;
		var invoice5;

		before(function(done) {


		 	invoice1 = Invoice.create(testdata.normalAccountId, '1', 20100201, 20100230);
			invoice1.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice1.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice2 = Invoice.create(testdata.normalAccountId, '2', 20100202, 20100230);
			invoice2.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice2.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice3 = Invoice.create(testdata.normalAccountId, '3', 20100210, 20100230);
			invoice3.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice3.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice4 = Invoice.create(testdata.normalAccountId, '4', 20100211, 20100230);
			invoice4.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice4.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice5 = Invoice.create(uuid.v1(), '5', 20100205, 20100230);
			invoice5.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice5.changeCustomer('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});			

			async.series([
				function(done) {

					invoice1.save(done);
				},
				function(done) {

					invoice2.save(done);
				},
				function(done) {

					invoice3.save(done);
				},
				function(done) {

					invoice4.save(done);
				},
				function(done) {

					invoice5.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/invoices/bydate/20100202/20100210')
						.set('Authorization', testdata.normalAccountToken)
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;
							done();
						});
				}
			], done);
		});

		it('should return invoices from the provided date (min)', function() {
			_.where(body, { id: invoice2.id }).length.should.eql(1);
		});

		it('should return invoices from the provided date (max)', function() {
			_.where(body, { id: invoice3.id }).length.should.eql(1);
		});

		it('should not return an invoice outside the range (min)', function() {
			_.where(body, { id: invoice1.id }).length.should.eql(0);
		});

		it('should not return an invoice outside the range (max)', function() {
			_.where(body, { id: invoice4.id }).length.should.eql(0);
		});

		it('should not return invoices from another tenant', function() {
			_.where(body, { id: invoice5.id }).length.should.eql(0);
		});
	});

	/**
	 * Create
	 */
	describe('When a invoice is created by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/invoices')
				.send({ number: '1234' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a invoice', function() {

		var response;
		var body;
		var invoice;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/invoices')
				.set('Authorization', testdata.normalAccountToken)
				.send({ 
					number: '20140101',
					date: 20140101,
					creditTerm: 20140130,
					template: '<h1>INVOICE</h1><p>{{ invoice.number }}</p>',
					customer: {
						name: 'John BVBA',
						vatNumber: 'BE12345678',
						number: '100',
						address: {
							line1: 'Kerkstraat',
							line2: 'Test',
							postalcode: '9999',
							city: 'Brussel'
						}
					},
					lines: [{
						description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
					},{
						description: 'item 2', quantity: 1, priceInCents: 100, vatPercentage: 20
					},{
						description: 'item 3', quantity: 5, priceInCents: 100, vatPercentage: 20
					}],
					linkedTimeRegistrationIds: [ 'abc', 'def' ]
				})
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Invoice.findById(body.id, function(err, c) {

						invoice = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			invoice.should.exist;
		});

		it('should create a invoice with the specified name', function() {

			invoice.number.should.eql('20140101');
		});

		it('should create a invoice with the specified date', function() {

			invoice.date.numeric.should.eql(20140101);
		});	

		it('sshould create a invoice with the specified credit term', function() {

			invoice.creditTerm.numeric.should.eql(20140130);
		});	

		it('should create a invoice with the specified template', function() {

			invoice.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should create a invoice with the specified to', function() {

			invoice.customer.name.should.eql('John BVBA');
			invoice.customer.vatNumber.should.eql('BE12345678');
			invoice.customer.number.should.eql('100');

			invoice.customer.address.line1.should.eql('Kerkstraat');
			invoice.customer.address.line2.should.eql('Test');
			invoice.customer.address.postalcode.should.eql('9999');
			invoice.customer.address.city.should.eql('Brussel');
		});	

		it('should create a invoice with the specified lines', function() {

			
			invoice.lines[0].description.should.eql('item 1');
			invoice.lines[0].quantity.should.eql(2);
			invoice.lines[0].priceInCents.should.eql(100);
			invoice.lines[0].vatPercentage.should.eql(21);
			invoice.lines[0].totalInCents.should.eql(200);

			invoice.lines[1].description.should.eql('item 2');
			invoice.lines[1].quantity.should.eql(1);
			invoice.lines[1].priceInCents.should.eql(100);
			invoice.lines[1].vatPercentage.should.eql(20);
			invoice.lines[1].totalInCents.should.eql(100);	
		});

		it('should create a invoice with the specified linked time registrations', function() {

			invoice.linkedTimeRegistrations[0].should.eql('abc');
			invoice.linkedTimeRegistrations[1].should.eql('def');
		});

		it('should create a invoice for the logged in user', function() {

			invoice.tenant.should.eql(testdata.normalAccountId);
		});
		
		it('should return the number of the invoice', function() {

			body.number.should.eql('20140101');
		});			

		it('should return the date of the invoice', function() {

			body.date.numeric.should.eql(20140101);
		});	

		it('should return the credit term of the invoice', function() {

			body.creditTerm.numeric.should.eql(20140130);
		});	

		it('should return the template of the invoice', function() {

			body.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should return info about the receiver of the invoice', function() {

			body.customer.name.should.eql('John BVBA');
			body.customer.vatNumber.should.eql('BE12345678');
			body.customer.number.should.eql('100');

			body.customer.address.line1.should.eql('Kerkstraat');
			body.customer.address.line2.should.eql('Test');
			body.customer.address.postalcode.should.eql('9999');
			body.customer.address.city.should.eql('Brussel');
		});	

		it('should return the lines of the invoice', function() {

			
			body.lines[0].description.should.eql('item 1');
			body.lines[0].quantity.should.eql(2);
			body.lines[0].priceInCents.should.eql(100);
			body.lines[0].price.should.eql(1);
			body.lines[0].vatPercentage.should.eql(21);
			body.lines[0].totalInCents.should.eql(200);
			body.lines[0].total.should.eql(2);

			body.lines[1].description.should.eql('item 2');
			body.lines[1].quantity.should.eql(1);
			body.lines[1].priceInCents.should.eql(100);
			body.lines[1].price.should.eql(1);
			body.lines[1].vatPercentage.should.eql(20);
			body.lines[1].totalInCents.should.eql(100);	
			body.lines[1].total.should.eql(1);	
		});

		it('should return the subtotal of the invoice in cents', function() {

			body.subTotalInCents.should.eql(800);
		});

		it('should return the subtotal of the invoice', function() {

			body.subTotal.should.eql(8);
		});

		it('should return the per vat totals of the invoice', function() {

			body.vatPerPercentages[0].vatPercentage.should.eql(20);
			body.vatPerPercentages[0].totalVatInCents.should.eql(120);
			body.vatPerPercentages[0].totalVat.should.eql(1.2);

			body.vatPerPercentages[1].vatPercentage.should.eql(21);
			body.vatPerPercentages[1].totalVatInCents.should.eql(42);
			body.vatPerPercentages[1].totalVat.should.eql(0.42);
		});

		it('should return the total vat of the invoice in cents', function() {

			body.totalVatInCents.should.eql(162);
		});

		it('should return the total of the invoice in cents', function() {

			body.totalInCents.should.eql(962);
		});	

		it('should return the total vat of the invoice', function() {

			body.totalVat.should.eql(1.62);
		});

		it('should return the total of the invoice', function() {

			body.total.should.eql(9.62);
		});

		it('should return the linked time registrations', function() {

			body.linkedTimeRegistrations[0].should.eql('abc');
			body.linkedTimeRegistrations[1].should.eql('def');
		});	
	});	

	describe('When previewing an invoice', function() {

		var response;
		var body;
		var invoice;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/invoices/preview')
				.set('Authorization', testdata.normalAccountToken)
				.send({ 
					number: '20140101',
					date: 20140101,
					creditTerm: 20140130,
					template: '<h1>INVOICE</h1><p>{{ invoice.number }}</p>',
					customer: {
						name: 'John BVBA',
						vatNumber: 'BE12345678',
						number: '100',
						address: {
							line1: 'Kerkstraat',
							line2: 'Test',
							postalcode: '9999',
							city: 'Brussel'
						}
					},
					lines: [{
						description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
					},{
						description: 'item 2', quantity: 1, priceInCents: 100, vatPercentage: 20
					},{
						description: 'item 3', quantity: 5, priceInCents: 100, vatPercentage: 20
					}],
					linkedTimeRegistrationIds: [ 'abc', 'def' ]
				})
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Invoice.findById(body.id, function(err, c) {

						invoice = c;
						done();
					});
				});
		});

		it('should not be saved in the database', function() {
			should.not.exist(invoice);
		});
		
		it('should return the number of the invoice', function() {

			body.number.should.eql('20140101');
		});			

		it('should return the date of the invoice', function() {

			body.date.numeric.should.eql(20140101);
		});	

		it('should return the credit term of the invoice', function() {

			body.creditTerm.numeric.should.eql(20140130);
		});	

		it('should return the template of the invoice', function() {

			body.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should return info about the receiver of the invoice', function() {

			body.customer.name.should.eql('John BVBA');
			body.customer.vatNumber.should.eql('BE12345678');
			body.customer.number.should.eql('100');

			body.customer.address.line1.should.eql('Kerkstraat');
			body.customer.address.line2.should.eql('Test');
			body.customer.address.postalcode.should.eql('9999');
			body.customer.address.city.should.eql('Brussel');
		});	

		it('should return the lines of the invoice', function() {

			
			body.lines[0].description.should.eql('item 1');
			body.lines[0].quantity.should.eql(2);
			body.lines[0].priceInCents.should.eql(100);
			body.lines[0].price.should.eql(1);
			body.lines[0].vatPercentage.should.eql(21);
			body.lines[0].totalInCents.should.eql(200);
			body.lines[0].total.should.eql(2);

			body.lines[1].description.should.eql('item 2');
			body.lines[1].quantity.should.eql(1);
			body.lines[1].priceInCents.should.eql(100);
			body.lines[1].price.should.eql(1);
			body.lines[1].vatPercentage.should.eql(20);
			body.lines[1].totalInCents.should.eql(100);	
			body.lines[1].total.should.eql(1);	
		});

		it('should return the subtotal of the invoice in cents', function() {

			body.subTotalInCents.should.eql(800);
		});

		it('should return the subtotal of the invoice', function() {

			body.subTotal.should.eql(8);
		});

		it('should return the per vat totals of the invoice', function() {

			body.vatPerPercentages[0].vatPercentage.should.eql(20);
			body.vatPerPercentages[0].totalVatInCents.should.eql(120);
			body.vatPerPercentages[0].totalVat.should.eql(1.2);

			body.vatPerPercentages[1].vatPercentage.should.eql(21);
			body.vatPerPercentages[1].totalVatInCents.should.eql(42);
			body.vatPerPercentages[1].totalVat.should.eql(0.42);
		});

		it('should return the total vat of the invoice in cents', function() {

			body.totalVatInCents.should.eql(162);
		});

		it('should return the total of the invoice in cents', function() {

			body.totalInCents.should.eql(962);
		});	

		it('should return the total vat of the invoice', function() {

			body.totalVat.should.eql(1.62);
		});

		it('should return the total of the invoice', function() {

			body.total.should.eql(9.62);
		});

		it('should return the linked time registrations', function() {

			body.linkedTimeRegistrations[0].should.eql('abc');
			body.linkedTimeRegistrations[1].should.eql('def');
		});	
	});		  
});