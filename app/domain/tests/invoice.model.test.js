'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	async = require('async'),
	Invoice = mongoose.model('Invoice'),
	TimeRegistration = require('mongoose').model('TimeRegistration'),
	Company = require('mongoose').model('Company'),
	Project = require('mongoose').model('Project');


describe('Invoice Model Unit Tests:', function() {

	var tenant = uuid.v1();

	describe('When an invoice is created', function() {

		var original, saved;

		before(function(done) {

			original = Invoice.create(tenant, 'number 1', 20140201, 20140301);

			original.changeTemplate('template');

			original.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Invoice.findOne({
				_id: original._id
			}, function(err, invoice) {

				should.not.exist(err);
				should.exist(invoice);

				saved = invoice;

				done();
			});
		});

		it('should have a tenant', function() {

			saved.tenant.should.eql(tenant);
		});

		it('should have a number', function() {

			saved.number.should.eql('number 1');
		});

		it('should have a date', function() {

			saved.date.year.should.eql(2014);
			saved.date.month.should.eql(2);
			saved.date.day.should.eql(1);
			saved.date.numeric.should.eql(20140201);
		});

		it('should have a credit term', function() {

			saved.creditTerm.year.should.eql(2014);
			saved.creditTerm.month.should.eql(3);
			saved.creditTerm.day.should.eql(1);	
			saved.creditTerm.numeric.should.eql(20140301);	
		});				

		it('should have version 3', function() {

			// invoice has 3 events in order to be valid
			saved.version.should.eql(3);
		});

		it('should have no sub totalInCents', function() {

			saved.subTotalInCents.should.eql(0);
		});

		it('should have no per vat totals', function() {

			saved.vatPerPercentages.length.should.eql(0);
		});

		it('should have no totalInCents vat', function() {

			saved.totalVatInCents.should.eql(0);
		});

		it('should have no totalInCents', function() {

			saved.totalInCents.should.eql(0);
		});

		it('should have a created event', function() {

			saved.events[0].number.should.eql('number 1');			
			saved.events[0].tenant.should.eql(tenant);
	
			saved.events[0].date.should.eql(20140201);
			saved.events[0].creditTerm.should.eql(20140301);

			saved.events[0].metadata.eventName.should.eql('InvoiceCreated');
		});

		it('should have created on date', function() {

			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Invoice.remove(done);
		});
	});

	describe('When an invoice is created with no tenant', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(null, 'number 1', 20140101, 20140201);

			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When an invoice is created with no number', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(tenant, '', 20140101, 20140201);

			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When an invoice is created with no date', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(tenant, 'number 1', null, new Date(2014, 2, 1));

			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When an invoice is created with no credit term', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(tenant, 'number 1', new Date(2014, 1, 1), null);

			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});		

	describe('When an invoice template is changed', function() {

		var original, saved;

		before(function() {
			original = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			original.changeTemplate('template');

			original.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Invoice.findOne({
				_id: original._id
			}, function(err, invoice) {

				should.not.exist(err);
				should.exist(invoice);

				saved = invoice;

				done();
			});
		});

		it('should have an updated template', function() {

			saved.template.should.eql('template');
		});

		it('should have the same created on date', function() {

			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a template changed event', function() {

			saved.events[1].template.should.eql('template');

			saved.events[1].metadata.eventName.should.eql('InvoiceTemplateChanged');
		});

		after(function(done) {
			Invoice.remove(done);
		});
	});

	describe('When an invoice template is changed with the same value', function() {

		var invoice;

		before(function() {
			invoice = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			invoice.changeTemplate('template');
			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
		});

		it('should not create a new event', function() {

			invoice.events.should.have.length(3);
		});
	});

	describe('When an invoice is created with no template', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(tenant, 'number', 20140101, 20140201);

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When an invoice customer is changed', function() {

		var original, saved;

		before(function() {
			original = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			original.changeTemplate('template');

			original.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Invoice.findOne({
				_id: original._id
			}, function(err, invoice) {

				should.not.exist(err);
				should.exist(invoice);

				saved = invoice;

				done();
			});
		});

		it('should have an updated customer name', function() {

			saved.customer.name.should.eql('to');
		});

		it('should have an updated customer vat number', function() {

			saved.customer.vatNumber.should.eql('tovat');
		});

		it('should have an updated customer customer number', function() {

			saved.customer.number.should.eql('tonumber');
		});

		it('should have an updated customer address line1', function() {

			saved.customer.address.line1.should.eql('to line 1');
		});

		it('should have an updated customer address postalcode', function() {

			saved.customer.address.postalcode.should.eql('to postalcode');
		});

		it('should have an updated customer address city', function() {

			saved.customer.address.city.should.eql('to city');
		});															

		it('should have the same created on date', function() {

			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a customer changed event', function() {

			saved.events[2].name.should.eql('to');
			saved.events[2].vatNumber.should.eql('tovat');
			saved.events[2].number.should.eql('tonumber');
			saved.events[2].address.line1.should.eql('to line 1');
			saved.events[2].address.postalcode.should.eql('to postalcode');
			saved.events[2].address.city.should.eql('to city');

			saved.events[2].metadata.eventName.should.eql('InvoiceCustomerChanged');
		});

		after(function(done) {
			Invoice.remove(done);
		});
	});

	describe('When an invoice customer is changed with the same value', function() {

		var invoice;

		before(function() {
			invoice = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});			
		});

		it('should not create a new event', function() {

			invoice.events.should.have.length(3);
		});
	});	

	describe('When an invoice is created with no to', function() {

		it('should fail', function(done) {

			var invoice = Invoice.create(tenant, 'number', 20140101, 20140201);

			invoice.changeTemplate('template');

			invoice.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When invoice lines are changed', function() {

		var original, saved;

		before(function() {
			original = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			original.changeTemplate('template');

			original.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			original.replaceLines([{
				description: 'item 1', quantity: 2, priceInCents: 100, vatPercentage: 21
			},{
				description: 'item 2', quantity: 1, priceInCents: 100, vatPercentage: 20
			},{
				description: 'item 3', quantity: 5, priceInCents: 100, vatPercentage: 20
			}]);
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Invoice.findOne({
				_id: original._id
			}, function(err, invoice) {

				should.not.exist(err);
				should.exist(invoice);

				saved = invoice;

				done();
			});
		});

		it('should have updated lines', function() {

			saved.lines[0].description.should.eql('item 1');
			saved.lines[0].quantity.should.eql(2);
			saved.lines[0].priceInCents.should.eql(100);
			saved.lines[0].vatPercentage.should.eql(21);
			saved.lines[0].totalInCents.should.eql(200);

			saved.lines[1].description.should.eql('item 2');
			saved.lines[1].quantity.should.eql(1);
			saved.lines[1].priceInCents.should.eql(100);
			saved.lines[1].vatPercentage.should.eql(20);
			saved.lines[1].totalInCents.should.eql(100);			
		});

		it('should have the same created on date', function() {

			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(4);
		});

		it('should update the subtotal', function() {

			saved.subTotalInCents.should.eql(800);
		});

		it('should update the per vat totals', function() {

			saved.vatPerPercentages[0].vatPercentage.should.eql(20);
			saved.vatPerPercentages[0].totalVatInCents.should.eql(120);

			saved.vatPerPercentages[1].vatPercentage.should.eql(21);
			saved.vatPerPercentages[1].totalVatInCents.should.eql(42);
		});

		it('should update the totalInCents vat', function() {

			saved.totalVatInCents.should.eql(162);
		});

		it('should update the totalInCents', function() {

			saved.totalInCents.should.eql(962);
		});

		it('should have a invoice lines changed event', function() {


			// invoice lines
			saved.events[3].lines[0].description.should.eql('item 1');
			saved.events[3].lines[0].quantity.should.eql(2);
			saved.events[3].lines[0].priceInCents.should.eql(100);
			saved.events[3].lines[0].vatPercentage.should.eql(21);
			saved.events[3].lines[0].totalInCents.should.eql(200);

			saved.events[3].lines[1].description.should.eql('item 2');
			saved.events[3].lines[1].quantity.should.eql(1);
			saved.events[3].lines[1].priceInCents.should.eql(100);
			saved.events[3].lines[1].vatPercentage.should.eql(20);
			saved.events[3].lines[1].totalInCents.should.eql(100);	

			// totals
			saved.events[3].totalInCents.should.eql(962);	
			saved.events[3].subTotalInCents.should.eql(800);	
			saved.events[3].totalVatInCents.should.eql(162);	

			// vat percentages
			saved.events[3].vatPerPercentages[0].vatPercentage.should.eql(20);
			saved.events[3].vatPerPercentages[0].totalVatInCents.should.eql(120);

			saved.events[3].vatPerPercentages[1].vatPercentage.should.eql(21);
			saved.events[3].vatPerPercentages[1].totalVatInCents.should.eql(42);

			// metadata
			saved.events[3].metadata.eventName.should.eql('InvoiceLinesChanged');
		});

		after(function(done) {
			Invoice.remove(done);
		});
	});

	describe('When an invoice template is changed with the same value', function() {

		var invoice;

		before(function() {
			invoice = Invoice.create(tenant, 'number 1', 20140101, 20140201);

			invoice.changeTemplate('template');
			invoice.changeTemplate('template');

			invoice.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	
		});

		it('should not create a new event', function() {

			invoice.events.should.have.length(3);
		});
	});

	describe('When an invoice is linked with time registrations', function() {

		var company, project, timeRegistration1, timeRegistration2, timeRegistration3;
		var original, saved;

		before(function(done) {
			
			company = Company.create('account1', '1', 'My Company');
			project = Project.create('account1', company.id, 'FM Manager', 'Freelance manager');
			timeRegistration1 = TimeRegistration.create('account1', company.id, project.id, 'Dev', true, 'Doing some work', 20001231, 1400, 1359);
			timeRegistration2 = TimeRegistration.create('account1', company.id, project.id, 'Dev', true, 'Doing some work', 20001231, 1400, 1359);
			timeRegistration3 = TimeRegistration.create('account2', company.id, project.id, 'Dev', true, 'Doing some work', 20001231, 1400, 1359);

			original = Invoice.create('account1', 'number 1', 20140101, 20140201);

			original.changeTemplate('template');

			original.changeCustomer('to', 'tovat', 'tonumber', {
				line1: 'to line 1', postalcode: 'to postalcode', city: 'to city'
			});	

			original.linkTimeRegistrations([ timeRegistration1.id, timeRegistration2.id, timeRegistration3.id ]);

			async.series([
				function(done) {

					company.save(done);
				},
				function(done) {

					project.save(done);
				},
				function(done) {

					timeRegistration1.save(done);
				},
				function(done) {

					timeRegistration2.save(done);
				},
				function(done) {

					timeRegistration3.save(done);
				},
				function(done) {

					original.save(done);
				}
			], done);
		});

		it('should be in the database', function(done) {
			Invoice.findOne({
				_id: original._id
			}, function(err, invoice) {

				should.not.exist(err);
				should.exist(invoice);

				saved = invoice;

				done();
			});
		});

		it('should contain the time registration ids', function() {

			saved.linkedTimeRegistrations[0].should.eql(timeRegistration1.id);
			saved.linkedTimeRegistrations[1].should.eql(timeRegistration2.id);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(4);
		});

		it('should have a time registrations linked changed event', function() {


			saved.events[3].timeRegistrationIds[0].should.eql(timeRegistration1.id);
			saved.events[3].timeRegistrationIds[1].should.eql(timeRegistration2.id);

			saved.events[3].metadata.eventName.should.eql('InvoiceTimeRegistrationsLinked');
		});

		it('should mark the time registrations as invoiced', function(done) {


			var tr1, tr2;

			async.series([
				function(done) {

					TimeRegistration.findOne({ _id: timeRegistration1.id }, function(err, tr) { tr1 = tr; done(); });
				},
				function(done) {

					TimeRegistration.findOne({ _id: timeRegistration2.id }, function(err, tr) { tr2 = tr; done(); });
				},
				function(done) {

					tr1.invoiced.should.be.true;
					tr2.invoiced.should.be.true;
					done();
				}
			], done);
		});

		it('should not mark time registrations from another tenant as invoiced', function(done) {


			var tr1;

			async.series([
				function(done) {

					TimeRegistration.findOne({ _id: timeRegistration3.id }, function(err, tr) { tr1 = tr; done(); });
				},
				function(done) {

					tr1.invoiced.should.be.false;
					done();
				}
			], done);
		});

		after(function(done) {
			Invoice.remove(done);
		});
	});
});