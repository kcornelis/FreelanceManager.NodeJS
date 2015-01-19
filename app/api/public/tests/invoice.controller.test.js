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
	describe('When a invoice is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
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

		before(function(done){

			invoice = Invoice.create(testdata.normalAccountId, '20140301', new Date(2014, 3, 31), new Date(2014, 4, 30));

			invoice.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');

			invoice.changeTo('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice.replaceLines([{
				description: 'item 1', quantity: 2, price: 100, vatPercentage: 21
			}]);

			async.series([
				function(done){
					invoice.save(done);
				},
				function(done){

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

		it('should return the number of the invoice', function(){
			body.number.should.eql('20140301');
		});			

		it('should return the date of the invoice', function(){
			new Date(body.date).should.eql(new Date(2014, 3, 31));
		});	

		it('should return the credit term of the invoice', function(){
			new Date(body.creditTerm).should.eql(new Date(2014, 4, 30));
		});	

		it('should return the template of the invoice', function(){
			body.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should return info about the receiver of the invoice', function(){
			body.to.name.should.eql('John BVBA');
			body.to.vatNumber.should.eql('BE12345678');
			body.to.customerNumber.should.eql('100');

			body.to.address.line1.should.eql('Kerkstraat');
			body.to.address.postalcode.should.eql('9999');
			body.to.address.city.should.eql('Brussel');
		});	

		it('should return the lines of the invoice', function(){
			body.lines[0].description.should.eql('item 1');
			body.lines[0].quantity.should.eql(2);
			body.lines[0].price.should.eql(100);
			body.lines[0].vatPercentage.should.eql(21);
			body.lines[0].total.should.eql(200);
		});	

		it('should return the sub total of the invoice', function(){
			body.subTotal.should.eql(200);
		});	

		it('should return the vat per percentage of the invoice', function(){
			body.vatPerPercentages[0].vatPercentage.should.eql(21);
			body.vatPerPercentages[0].totalVat.should.eql(42);
		});	

		it('should return the total vat of the invoice', function(){
			body.totalVat.should.eql(42);
		});	

		it('should return the total of the invoice', function(){
			body.total.should.eql(242);
		});	

	});

	describe('When a invoice is requested by id by another tenant', function() {

		var response;
		var body;
		var invoice;

		before(function(done){
			
			invoice = Invoice.create(uuid.v1(), '20140301', new Date(2014, 3, 31), new Date(2014, 4, 30));

			invoice.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');

			invoice.changeTo('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice.replaceLines([{
				description: 'item 1', quantity: 2, price: 100, vatPercentage: 21
			}]);
			
			async.series([
				function(done){
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
	describe('When all invoices are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
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

		before(function(done){

		 	invoice1 = Invoice.create(testdata.normalAccountId, '20140301', new Date(2014, 3, 31), new Date(2014, 4, 30));
			invoice1.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice1.changeTo('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice2 = Invoice.create(testdata.normalAccountId, '20140302', new Date(2014, 3, 31), new Date(2014, 4, 30));
			invoice2.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice2.changeTo('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	

			invoice3 = Invoice.create(uuid.v1(), '20140303', new Date(2014, 3, 31), new Date(2014, 4, 30));
			invoice3.changeTemplate('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
			invoice3.changeTo('John BVBA', 'BE12345678', '100', {
				line1: 'Kerkstraat', postalcode: '9999', city: 'Brussel'
			});	
			
			async.series([
				function(done){
					invoice1.save(done);
				},
				function(done){
					invoice2.save(done);
				},
				function(done){
					invoice3.save(done);
				},
				function(done){
					
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
	 * Create
	 */
	describe('When a invoice is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
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
					date: new Date(2014, 1, 1),
					creditTerm: new Date(2014, 1, 30),
					template: '<h1>INVOICE</h1><p>{{ invoice.number }}</p>',
					to: {
						name: 'John BVBA',
						vatNumber: 'BE12345678',
						customerNumber: '100',
						address: {
							line1: 'Kerkstraat',
							line2: 'Test',
							postalcode: '9999',
							city: 'Brussel'
						}
					},
					lines: [{
						description: 'item 1', quantity: 2, price: 100, vatPercentage: 21
					},{
						description: 'item 2', quantity: 1, price: 100, vatPercentage: 20
					},{
						description: 'item 3', quantity: 5, price: 100, vatPercentage: 20
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

					Invoice.findById(body.id, function(err, c){
						invoice = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			invoice.should.exist;
		});

		it('should create a invoice with the specified name', function(){
			invoice.number.should.eql('20140101');
		});

		it('should create a invoice with the specified date', function(){
			new Date(invoice.date).should.eql(new Date(2014, 1, 1));
		});	

		it('sshould create a invoice with the specified credit term', function(){
			new Date(invoice.creditTerm).should.eql(new Date(2014, 1, 30));
		});	

		it('should create a invoice with the specified template', function(){
			invoice.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should create a invoice with the specified to', function(){
			invoice.to.name.should.eql('John BVBA');
			invoice.to.vatNumber.should.eql('BE12345678');
			invoice.to.customerNumber.should.eql('100');

			invoice.to.address.line1.should.eql('Kerkstraat');
			invoice.to.address.line2.should.eql('Test');
			invoice.to.address.postalcode.should.eql('9999');
			invoice.to.address.city.should.eql('Brussel');
		});	

		it('should create a invoice with the specified lines', function(){
			
			invoice.lines[0].description.should.eql('item 1');
			invoice.lines[0].quantity.should.eql(2);
			invoice.lines[0].price.should.eql(100);
			invoice.lines[0].vatPercentage.should.eql(21);
			invoice.lines[0].total.should.eql(200);

			invoice.lines[1].description.should.eql('item 2');
			invoice.lines[1].quantity.should.eql(1);
			invoice.lines[1].price.should.eql(100);
			invoice.lines[1].vatPercentage.should.eql(20);
			invoice.lines[1].total.should.eql(100);	
		});

		it('should create a invoice with the specified linked time registrations', function(){
			invoice.linkedTimeRegistrations[0].should.eql('abc');
			invoice.linkedTimeRegistrations[1].should.eql('def');
		});

		it('should create a invoice for the logged in user', function(){
			invoice.tenant.should.eql(testdata.normalAccountId);
		});
		
		it('should return the number of the invoice', function(){
			body.number.should.eql('20140101');
		});			

		it('should return the date of the invoice', function(){
			new Date(body.date).should.eql(new Date(2014, 1, 1));
		});	

		it('should return the credit term of the invoice', function(){
			new Date(body.creditTerm).should.eql(new Date(2014, 1, 30));
		});	

		it('should return the template of the invoice', function(){
			body.template.should.eql('<h1>INVOICE</h1><p>{{ invoice.number }}</p>');
		});

		it('should return info about the receiver of the invoice', function(){
			body.to.name.should.eql('John BVBA');
			body.to.vatNumber.should.eql('BE12345678');
			body.to.customerNumber.should.eql('100');

			body.to.address.line1.should.eql('Kerkstraat');
			body.to.address.line2.should.eql('Test');
			body.to.address.postalcode.should.eql('9999');
			body.to.address.city.should.eql('Brussel');
		});	

		it('should return the lines of the invoice', function(){
			
			body.lines[0].description.should.eql('item 1');
			body.lines[0].quantity.should.eql(2);
			body.lines[0].price.should.eql(100);
			body.lines[0].vatPercentage.should.eql(21);
			body.lines[0].total.should.eql(200);

			body.lines[1].description.should.eql('item 2');
			body.lines[1].quantity.should.eql(1);
			body.lines[1].price.should.eql(100);
			body.lines[1].vatPercentage.should.eql(20);
			body.lines[1].total.should.eql(100);	
		});

		it('should return the subtotal of the invoice', function(){
			body.subTotal.should.eql(800);
		});

		it('should return the per vat totals of the invoice', function(){
			body.vatPerPercentages[0].vatPercentage.should.eql(20);
			body.vatPerPercentages[0].totalVat.should.eql(120);

			body.vatPerPercentages[1].vatPercentage.should.eql(21);
			body.vatPerPercentages[1].totalVat.should.eql(42);
		});

		it('should return the total vat of the invoice', function(){
			body.totalVat.should.eql(162);
		});

		it('should return the total of the invoice', function(){
			body.total.should.eql(962);
		});	

		it('should return the linked time registrations', function(){
			body.linkedTimeRegistrations[0].should.eql('abc');
			body.linkedTimeRegistrations[1].should.eql('def');
		});	
	});	  
});