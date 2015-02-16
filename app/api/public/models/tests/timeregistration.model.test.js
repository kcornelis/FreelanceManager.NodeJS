'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	TimeRegistration = mongoose.model('TimeRegistration');


describe('TimeRegistration Model Unit Tests:', function() {

	var tenant = uuid.v1();

	describe('When an timeRegistration is created', function() {

		var original, saved;

		before(function(done) {
			original = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 30, 1205);
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			TimeRegistration.findOne({
				_id: original._id
			}, function(err, timeRegistration) {

				should.not.exist(err);
				should.exist(timeRegistration);

				saved = timeRegistration;

				done();
			});
		});

		it('should have a tenant', function(){
			saved.tenant.should.eql(tenant);
		});

		it('should have a project id', function(){
			saved.projectId.should.eql('project');
		});

		it('should have a company id', function(){
			saved.companyId.should.eql('company');
		});

		it('should have a task', function(){
			saved.task.should.eql('task');
		});

		it('should have a billable property', function(){
			saved.billable.should.eql(true);
		});

		it('should have a description', function(){
			saved.description.should.eql('description');
		});

		it('should have a date', function(){
			saved.date.year.should.eql(2014);
			saved.date.month.should.eql(10);
			saved.date.day.should.eql(20);
			saved.date.numeric.should.eql(20141020);
		});

		it('should have a from time', function(){
			saved.from.hour.should.eql(0);
			saved.from.minutes.should.eql(30);
			saved.from.numeric.should.eql(30);
		});

		it('should have a to time', function(){
			saved.to.hour.should.eql(12);
			saved.to.minutes.should.eql(5);
			saved.to.numeric.should.eql(1205);
		});

		it('should have a total minutes', function(){
			saved.totalMinutes.should.eql(695);
		});

		it('should not be marked as invoiced', function(){
			saved.invoiced.should.eql(false);
			(saved.invoicedOn === undefined).should.true;
			(saved.invoiceId === undefined).should.true;
		});

		it('should have version 1', function(){
			saved.version.should.eql(1);
		});

		it('should have a created event', function(){
			saved.events[0].companyId.should.eql('company');			
			saved.events[0].projectId.should.eql('project');			
			saved.events[0].task.should.eql('task');
			saved.events[0].billable.should.eql(true);			
			saved.events[0].description.should.eql('description');			
			saved.events[0].date.should.eql(20141020);			
			saved.events[0].from.should.eql(30);			
			saved.events[0].to.should.eql(1205);			
			saved.events[0].tenant.should.eql(tenant);

			saved.events[0].metadata.eventName.should.eql('TimeRegistrationCreated');
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			TimeRegistration.remove(done);
		});
	});

	describe('When an timeRegistration is created with 00:00 time', function() {

		var original;

		before(function(done) {
			original = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 0, 0);
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		after(function(done) {
			TimeRegistration.remove(done);
		});
	});

	describe('When a timeRegistration is created with no tenant', function() {

		it('should fail', function(done) {

			var timeRegistration = TimeRegistration.create(null,'company', 'project', 'task', true, 'description', 20141020, 1030, 1205);
			timeRegistration.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a timeRegistration is created with no company', function() {

		it('should fail', function(done) {

			var timeRegistration = TimeRegistration.create(tenant, undefined, 'project', 'task', true, 'description', 20141020, 1030, 1205);
			timeRegistration.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a timeRegistration is created with no project', function() {

		it('should fail', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', '', 'task', true, 'description', 20141020, 1030, 1205);
			timeRegistration.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a timeRegistration is created with no task', function() {

		it('should fail', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', '', true, 'description', 20141020, 1030, 1205);
			timeRegistration.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});	

	describe('When a timeRegistration is created with no date', function() {

		it('should fail', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', null, 1030, 1205);
			timeRegistration.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a timeRegistration is created with to low year', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 18991010, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});

	describe('When a timeRegistration is created with to high year', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 22011010, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});	

	describe('When a timeRegistration is created with to low month', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20000010, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});

	describe('When a timeRegistration is created with to high month', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20001310, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});	

	describe('When a timeRegistration is created with to low day', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20000100, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});

	describe('When a timeRegistration is created with to high day', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20001232, 1030, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});	

	describe('When a timeRegistration is created with to high from minutes', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20001110, 1060, 1205);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});	

	describe('When a timeRegistration is created with to high to minutes', function() {

		it('should fail to save', function(done) {

			var timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20001110, 1059, 1261);
			timeRegistration.save(function(err) { should.exist(err); done(); });
		});
	});				

	describe('When a timeRegistration details is changed', function() {

		var original, saved;

		before(function(done) {
			original = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 30, 1205);
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			TimeRegistration.findOne({
				_id: original._id
			}, function(finderr, timeRegistration) {

				should.not.exist(finderr);

				timeRegistration.changeDetails('John Doe BVBA', 'Project 1', 'Dev', false, 'Doing some work', 20141010, 1000, 2359);

				timeRegistration.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			TimeRegistration.findOne({
				_id: original._id
			}, function(err, timeRegistration) {

				should.not.exist(err);
				should.exist(timeRegistration);

				saved = timeRegistration;

				done();
			});
		});

		it('should have a project id', function(){
			saved.projectId.should.eql('Project 1');
		});

		it('should have a company id', function(){
			saved.companyId.should.eql('John Doe BVBA');
		});

		it('should have a task', function(){
			saved.task.should.eql('Dev');
		});

		it('should have a billable property', function(){
			saved.billable.should.eql(false);
		});

		it('should have a description', function(){
			saved.description.should.eql('Doing some work');
		});

		it('should have a date', function(){
			saved.date.year.should.eql(2014);
			saved.date.month.should.eql(10);
			saved.date.day.should.eql(10);
			saved.date.numeric.should.eql(20141010);
		});

		it('should have a from time', function(){
			saved.from.hour.should.eql(10);
			saved.from.minutes.should.eql(0);
			saved.from.numeric.should.eql(1000);
		});

		it('should have a to time', function(){
			saved.to.hour.should.eql(23);
			saved.to.minutes.should.eql(59);
			saved.to.numeric.should.eql(2359);
		});

		it('should have version 2', function(){
			saved.version.should.eql(2);
		});

		it('should have a total minutes', function(){
			saved.totalMinutes.should.eql(839);
		});

		it('should have a created event', function(){
			saved.events[1].companyId.should.eql('John Doe BVBA');			
			saved.events[1].projectId.should.eql('Project 1');			
			saved.events[1].task.should.eql('Dev');
			saved.events[1].billable.should.eql(false);	
			saved.events[1].description.should.eql('Doing some work');			
			saved.events[1].date.should.eql(20141010);			
			saved.events[1].from.should.eql(1000);			
			saved.events[1].to.should.eql(2359);

			saved.events[1].metadata.eventName.should.eql('TimeRegistrationDetailsChanged');
		});

		after(function(done) {
			TimeRegistration.remove(done);
		});
	});

	describe('When a timeRegistration details is changed with the same values', function() {

		var timeRegistration;

		before(function() {
			timeRegistration = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 30, 1205);
			timeRegistration.changeDetails('company', 'project', 'task', true, 'description', 20141020, 30, 1205);
		});

		it('should not create a new event', function(){
			timeRegistration.events.should.have.length(1);
		});

		after(function(done) {
			TimeRegistration.remove(done);
		});
	});

	describe('When a time registration is marked as invoiced', function(){

		var original, timeRegistration;

		before(function(done) {
			original = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 30, 1205);
			original.markInvoiced('invoice id');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			
			TimeRegistration.findOne({
				_id: original._id
			}, function(finderr, tr) {

				timeRegistration = tr;
				done();
			});
		});

		it('should be marked as invoiced', function(){
			timeRegistration.invoiced.should.be.true;
		});

		it('should should contain the invoice id', function(){
			timeRegistration.invoiceId.should.eql('invoice id');
		});

		it('should have the invoiced on date', function(){
			new Date(timeRegistration.invoicedOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(timeRegistration.invoicedOn).should.lessThan(new Date(Date.now() + 10000));
		});

		it('should have version 2', function(){
			timeRegistration.version.should.eql(2);
		});

		it('should have a marked invoiced event', function(){
			timeRegistration.events[1].invoiced.should.be.true;			
			new Date(timeRegistration.events[1].invoicedOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(timeRegistration.events[1].invoicedOn).should.lessThan(new Date(Date.now() + 10000));		
			timeRegistration.events[1].invoiceId.should.eql('invoice id');

			timeRegistration.events[1].metadata.eventName.should.eql('TimeRegistrationMarkedAsInvoiced');
		});

		after(function(done) {
			TimeRegistration.remove(done);
		});
	});

	describe('When a time registration is marked as invoiced twice', function(){

		it('should fail', function() {
			
			var tr = TimeRegistration.create(tenant,'company', 'project', 'task', true, 'description', 20141020, 30, 1205);
			tr.markInvoiced('invoice id');
			tr.markInvoiced.bind('invoice id 2').should.throw();
		});
	});
});