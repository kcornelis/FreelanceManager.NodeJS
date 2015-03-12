'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	Company = mongoose.model('Company');


describe('Company Model Unit Tests:', function() {

	var tenant = uuid.v1();

	describe('When an company is created', function() {

		var original, saved;

		before(function(done) {
			original = Company.create(tenant, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Company.findOne({
				_id: original._id
			}, function(err, company) {

				should.not.exist(err);
				should.exist(company);

				saved = company;

				done();
			});
		});

		it('should have a tenant', function(){
			saved.tenant.should.eql(tenant);
		});

		it('should have a number', function(){
			saved.number.should.eql('1');
		});		

		it('should have a name', function(){
			saved.name.should.eql('John Doe');
		});

		it('should have a vat number', function(){
			saved.vatNumber.should.eql('BE123');
		});		

		it('should have a address', function(){
			saved.address.line1.should.eql('kerkstraat');
			saved.address.line2.should.eql('tav me');
			saved.address.postalcode.should.eql('1000');
			saved.address.city.should.eql('brussel');
		});	

		it('should have version 1', function(){
			saved.version.should.eql(1);
		});

		it('should have a created event', function(){
			saved.events[0].name.should.eql('John Doe');			
			saved.events[0].tenant.should.eql(tenant);
			saved.events[0].number.should.eql('1');
			saved.events[0].vatNumber.should.eql('BE123');
			saved.events[0].address.line1.should.eql('kerkstraat');
			saved.events[0].address.line2.should.eql('tav me');
			saved.events[0].address.postalcode.should.eql('1000');
			saved.events[0].address.city.should.eql('brussel');

			saved.events[0].metadata.eventName.should.eql('CompanyCreated');
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Company.remove(done);
		});
	});

	describe('When a company is created with no tenant', function() {

		it('should fail', function(done) {

			var company = Company.create(null, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			company.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a company is created with no name', function() {

		it('should fail', function(done) {

			var company = Company.create(tenant, '1', '', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			company.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a company is created with no number', function() {

		it('should fail', function(done) {

			var company = Company.create(tenant, '', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			company.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});	

	describe('When company details are changed', function() {

		var original, saved;

		before(function(done) {
			original = Company.create(tenant, '1', 'John Doe', 'BE123');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Company.findOne({
				_id: original._id
			}, function(finderr, company) {

				should.not.exist(finderr);

				company.changeDetails('Jane Doe', 'BE12345', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel' });

				company.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Company.findOne({
				_id: original._id
			}, function(err, company) {

				should.not.exist(err);
				should.exist(company);

				saved = company;

				done();
			});
		});

		it('should have an updated name', function(){
			saved.name.should.eql('Jane Doe');
		});

		it('should have an updated name', function(){
			saved.vatNumber.should.eql('BE12345');
		});		

		it('should have an updated address', function(){
			saved.address.line1.should.eql('kerkstraat');
			saved.address.line2.should.eql('tav me');
			saved.address.postalcode.should.eql('1000');
			saved.address.city.should.eql('brussel');
		});			

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function(){
			saved.version.should.eql(2);
		});

		it('should have a details changed event', function(){
			saved.events[1].name.should.eql('Jane Doe');
			saved.events[1].vatNumber.should.eql('BE12345');
			saved.events[1].address.line1.should.eql('kerkstraat');
			saved.events[1].address.line2.should.eql('tav me');
			saved.events[1].address.postalcode.should.eql('1000');
			saved.events[1].address.city.should.eql('brussel');

			saved.events[1].metadata.eventName.should.eql('CompanyDetailsChanged');
		});

		after(function(done) {
			Company.remove(done);
		});
	});

	describe('When company details are changed with the same values', function() {

		var company;

		before(function() {
			company = Company.create(tenant, '1', 'John Doe BVBA', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			company.changeDetails('John Doe BVBA', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
		});

		it('should not create a new event', function(){
			company.events.should.have.length(1);
		});

		after(function(done) {
			Company.remove(done);
		});
	});
});