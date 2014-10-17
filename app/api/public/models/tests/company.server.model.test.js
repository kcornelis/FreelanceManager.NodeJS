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
			original = Company.create(tenant, 'John Doe');
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

		it('should have a name', function(){
			saved.name.should.eql('John Doe');
		});

		it('should have version 1', function(){
			saved.version.should.eql(1);
		});

		it('should have a created event', function(){
			saved.events[0].name.should.eql('John Doe');			
			saved.events[0].tenant.should.eql(tenant);

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


	describe('When a company details is changed', function() {

		var original, saved;

		before(function(done) {
			original = Company.create(tenant, 'John Doe');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Company.findOne({
				_id: original._id
			}, function(finderr, company) {

				should.not.exist(finderr);

				company.changeDetails('Jane Doe')

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

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function(){
			saved.version.should.eql(2);
		});

		it('should have a details changed event', function(){
			saved.events[1].name.should.eql('Jane Doe');

			saved.events[1].metadata.eventName.should.eql('CompanyDetailsChanged');
		});

		after(function(done) {
			Company.remove(done);
		});
	});

	describe('When a company details is changed with the same values', function() {

		var company;

		before(function() {
			company = Company.create(tenant, 'John Doe BVBA');
			company.changeDetails('John Doe BVBA');
		});

		it('should not create a new event', function(){
			company.events.should.have.length(1);
		});

		after(function(done) {
			Company.remove(done);
		});
	});
});