'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	Invoice = mongoose.model('Invoice'),
	convert = require('../invoice');

describe('Invoice Converter Unit Tests:', function() {

	describe('When an invoice is converted to a dto', function() {

		var converted;

		beforeEach(function() {
			var invoice = Invoice.create('1', 'number 1', 20140201, 20140301);
			invoice.changeTemplate('template');
			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
			invoice.replaceLines([{
				description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
			},{
				description: 'item 2', quantity: 1, priceInCents: 100, vatPercentage: 20
			},{
				description: 'item 3', quantity: 5, priceInCents: 100, vatPercentage: 20
			}]);

			converted = convert.toDto(invoice);
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a number', function() {
			converted.number.should.eql('number 1');
		});

		it('should have a date', function() {
			converted.date.year.should.eql(2014);
			converted.date.month.should.eql(2);
			converted.date.day.should.eql(1);
			converted.date.numeric.should.eql(20140201);
		});

		it('should have a credit term', function() {
			converted.creditTerm.year.should.eql(2014);
			converted.creditTerm.month.should.eql(3);
			converted.creditTerm.day.should.eql(1);	
			converted.creditTerm.numeric.should.eql(20140301);	
		});	

		it('should have a template', function() {
			converted.template.should.eql('template');
		});

		it('should have a customer name', function() {
			converted.customer.name.should.eql('to');
		});

		it('should have a customer vat number', function() {
			converted.customer.vatNumber.should.eql('tovat');
		});

		it('should have a customer customer number', function() {
			converted.customer.number.should.eql('tonumber');
		});

		it('should have a customer address line1', function() {
			converted.customer.address.line1.should.eql('to line 1');
		});

		it('should have a customer address postalcode', function() {
			converted.customer.address.postalcode.should.eql('to postalcode');
		});

		it('should have a customer address city', function() {
			converted.customer.address.city.should.eql('to city');
		});

		it('should have lines', function() {

			converted.lines[0].description.should.eql('item 1');
			converted.lines[0].quantity.should.eql(2);
			converted.lines[0].priceInCents.should.eql(100);
			converted.lines[0].vatPercentage.should.eql(21);
			converted.lines[0].totalInCents.should.eql(200);

			converted.lines[1].description.should.eql('item 2');
			converted.lines[1].quantity.should.eql(1);
			converted.lines[1].priceInCents.should.eql(100);
			converted.lines[1].vatPercentage.should.eql(20);
			converted.lines[1].totalInCents.should.eql(100);			
		});

		it('should have the subtotal in cents', function() {
			converted.subTotalInCents.should.eql(800);
		});

		it('should have the subtotal', function() {
			converted.subTotal.should.eql(8);
		});

		it('should have the per vat totals', function() {
			converted.vatPerPercentages[0].vatPercentage.should.eql(20);
			converted.vatPerPercentages[0].totalVatInCents.should.eql(120);
			converted.vatPerPercentages[0].totalVat.should.eql(1.2);

			converted.vatPerPercentages[1].vatPercentage.should.eql(21);
			converted.vatPerPercentages[1].totalVatInCents.should.eql(42);
			converted.vatPerPercentages[1].totalVat.should.eql(0.42);
		});

		it('should have the total in cents vat', function() {
			converted.totalVatInCents.should.eql(162);
		});

		it('should have the total vat', function() {
			converted.totalVat.should.eql(1.62);
		});

		it('should have the total in cents', function() {
			converted.totalInCents.should.eql(962);
		});

		it('should have the total', function() {
			converted.total.should.eql(9.62);
		});
	});

	describe('When multiple invoices are converted to dtos', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto([
				Invoice.create('1', 'number 1', 'invoice content 1'),
				Invoice.create('2', 'number 2', 'invoice content 2')
			]);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].number.should.eql('number 1');
			converted[1].number.should.eql('number 2');
		});
	});

	describe('When an invoice is converted to a dto with a promise', function() {

		var converted;

		beforeEach(function(done) {
			var invoice = Invoice.create('1', 'number 1', 20140201, 20140301);
			invoice.changeTemplate('template');
			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
			invoice.replaceLines([{
				description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
			},{
				description: 'item 2', quantity: 1, priceInCents: 100, vatPercentage: 20
			},{
				description: 'item 3', quantity: 5, priceInCents: 100, vatPercentage: 20
			}]);

			convert.toDtoQ(invoice)
				.then(function(a) { converted = a; })
				.finally(done)
				.done();
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a number', function() {
			converted.number.should.eql('number 1');
		});

		it('should have a date', function() {
			converted.date.year.should.eql(2014);
			converted.date.month.should.eql(2);
			converted.date.day.should.eql(1);
			converted.date.numeric.should.eql(20140201);
		});

		it('should have a credit term', function() {
			converted.creditTerm.year.should.eql(2014);
			converted.creditTerm.month.should.eql(3);
			converted.creditTerm.day.should.eql(1);	
			converted.creditTerm.numeric.should.eql(20140301);	
		});	

		it('should have a template', function() {
			converted.template.should.eql('template');
		});

		it('should have a customer name', function() {
			converted.customer.name.should.eql('to');
		});

		it('should have a customer vat number', function() {
			converted.customer.vatNumber.should.eql('tovat');
		});

		it('should have a customer customer number', function() {
			converted.customer.number.should.eql('tonumber');
		});

		it('should have a customer address line1', function() {
			converted.customer.address.line1.should.eql('to line 1');
		});

		it('should have a customer address postalcode', function() {
			converted.customer.address.postalcode.should.eql('to postalcode');
		});

		it('should have a customer address city', function() {
			converted.customer.address.city.should.eql('to city');
		});

		it('should have lines', function() {

			converted.lines[0].description.should.eql('item 1');
			converted.lines[0].quantity.should.eql(2);
			converted.lines[0].priceInCents.should.eql(100);
			converted.lines[0].vatPercentage.should.eql(21);
			converted.lines[0].totalInCents.should.eql(200);

			converted.lines[1].description.should.eql('item 2');
			converted.lines[1].quantity.should.eql(1);
			converted.lines[1].priceInCents.should.eql(100);
			converted.lines[1].vatPercentage.should.eql(20);
			converted.lines[1].totalInCents.should.eql(100);			
		});

		it('should have the subtotal in cents', function() {
			converted.subTotalInCents.should.eql(800);
		});

		it('should have the subtotal', function() {
			converted.subTotal.should.eql(8);
		});

		it('should have the per vat totals', function() {
			converted.vatPerPercentages[0].vatPercentage.should.eql(20);
			converted.vatPerPercentages[0].totalVatInCents.should.eql(120);
			converted.vatPerPercentages[0].totalVat.should.eql(1.2);

			converted.vatPerPercentages[1].vatPercentage.should.eql(21);
			converted.vatPerPercentages[1].totalVatInCents.should.eql(42);
			converted.vatPerPercentages[1].totalVat.should.eql(0.42);
		});

		it('should have the total in cents vat', function() {
			converted.totalVatInCents.should.eql(162);
		});

		it('should have the total vat', function() {
			converted.totalVat.should.eql(1.62);
		});

		it('should have the total in cents', function() {
			converted.totalInCents.should.eql(962);
		});

		it('should have the total', function() {
			converted.total.should.eql(9.62);
		});
	});
});
