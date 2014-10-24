'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/timeregistration'),
	config = require_config(),
	uuid = require('node-uuid'),
	TimeRegistration = require('mongoose').model('TimeRegistration'),
	testdata = require_infrastructure('testdata');


describe('Public API: TimeRegistration Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When a time registration is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a time registration is requested by id', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done){
			timeRegistration = TimeRegistration.create(testdata.normalAccountId, 'John Doe BVBA', 'Project 1', 'Dev', 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done){
					timeRegistration.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/' + timeRegistration.id)
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
		
		it('should return the id of the time registration', function() {
			body.id.should.eql(timeRegistration.id);
		});

		it('should return a time registration with the companyId', function(){
			body.companyId.should.eql('John Doe BVBA');
		});	

		it('should return a time registration with the projectId', function(){
			body.projectId.should.eql('Project 1');
		});

		it('should return a time registration with the task', function(){
			body.task.should.eql('Dev');
		});

		it('should return a time registration with the description', function(){
			body.description.should.eql('Doing some work');
		});

		it('should return a time registration with the date', function(){
			body.date.year.should.eql(2000);
			body.date.month.should.eql(12);
			body.date.day.should.eql(31);
			body.date.numeric.should.eql(20001231);
		});

		it('should return a time registration with the from time', function(){
			body.from.hour.should.eql(14);
			body.from.minutes.should.eql(0);
			body.from.numeric.should.eql(1400);
		});

		it('should return a time registration with the to time', function(){
			body.to.hour.should.eql(13);
			body.to.minutes.should.eql(59);
			body.to.numeric.should.eql(1359);
		});		

		it('should return a time registration with the total minutes', function(){
			body.totalMinutes.should.eql(1439);
		});		
	});

	describe('When a time registration is requested by id by another tenant', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done){
			timeRegistration = TimeRegistration.create(uuid.v1(), 'John Doe BVBA', 'Project 1', 'Dev', 'Doing some work', 20001231, 1400, 1500);
			
			async.series([
				function(done){
					timeRegistration.save(done);
				}
			], done);
		});
		
		it('should not return the time registration', function(done) {
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/' + timeRegistration.id)
				.set('Authorization', testdata.normalAccountToken)
				.expect(404)
				.expect('Content-Type', /html/)
				.end(done);
		});
	});

	/**
	 * Get all time registrations
	 */
	describe('When all time registrations are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations')
				.expect(401)
				.end(done);
		});
	});

	describe('When all time registrations are requested', function() {

		var response;
		var body;

		var company1;
		var company2;
		var company3;

		before(function(done){
			company1 = TimeRegistration.create(testdata.normalAccountId, 'John Doe BVBA', 'Project 1', 'Dev', 'Doing some work', 20001231, 1400, 1500);
			company2 = TimeRegistration.create(testdata.normalAccountId, 'John Doe BVBA', 'Project 1', 'Dev', 'Doing some work', 20001231, 1500, 1600);
			company3 = TimeRegistration.create(uuid.v1(), 'John Doe BVBA', 'Project 1', 'Dev', 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done){
					company1.save(done);
				},
				function(done){
					company2.save(done);
				},
				function(done){
					company3.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations')
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

		it('should return a collection with the first time time registration', function() {
			_.where(body, { id: company1.id }).should.exist;
		});

		it('should return a collection with the second time registration', function() {
			_.where(body, { id: company2.id }).should.exist;
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: company3.id }).should.not.exist;
		});
	});


	/**
	 * Create
	 */
	describe('When a time registration is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/timeregistrations')
				.send({ companyId: 'company', projectId: 'project', task: 'dev',
						description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a time registration', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/timeregistrations')
				.set('Authorization', testdata.normalAccountToken)
				.send({ companyId: 'company', projectId: 'project', task: 'dev',
						description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					TimeRegistration.findById(body.id, function(err, c){
						timeRegistration = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			timeRegistration.should.exist;
		});

		it('should create a time registration with the specified company id', function(){
			timeRegistration.companyId.should.eql('company');
		});

		it('should create a time registration with the specified project id', function(){
			timeRegistration.projectId.should.eql('project');
		});

		it('should create a time registration with the specified task', function(){
			timeRegistration.task.should.eql('dev');
		});

		it('should create a time registration with the specified description', function(){
			timeRegistration.description.should.eql('doing some work');
		});

		it('should create a time registration with the specified date', function(){
			timeRegistration.date.numeric.should.eql(20100304);
		});

		it('should create a time registration with the specified from time', function(){
			timeRegistration.from.numeric.should.eql(1015);
		});

		it('should create a time registration with the specified to time', function(){
			timeRegistration.to.numeric.should.eql(1215);
		});

		it('should create a time registration for the logged in user', function(){
			timeRegistration.tenant.should.eql(testdata.normalAccountId);
		});
		
		it('should return the id of the time registration', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the company id', function(){
			body.companyId.should.eql('company');
		});

		it('should return the project id', function(){
			body.projectId.should.eql('project');
		});

		it('should return the task', function(){
			body.task.should.eql('dev');
		});

		it('should return the description', function(){
			body.description.should.eql('doing some work');
		});

		it('should return the date', function(){
			body.date.numeric.should.eql(20100304);
		});

		it('should return the from time', function(){
			body.from.numeric.should.eql(1015);
		});

		it('should return the to time', function(){
			body.to.numeric.should.eql(1215);
		});
	});	 

	/**
	 * Update
	 */
	describe('When a time registration is updated by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/timeregistrations/' + uuid.v1())
				.send({ companyId: 'company', projectId: 'project', task: 'dev',
						description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating a time registration', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(testdata.normalAccountId, 'John Doe BVBA', 'Project 1', 'development', 'work', 20001231, 1400, 1359);

			async.series([
				function(done){
					timeRegistration.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: 'company', projectId: 'project', task: 'dev',
								description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							TimeRegistration.findById(body.id, function(err, c){
								timeRegistration = c;
								done();
							});
						});
				}
			], done);
		});

		it('should be saved in the database', function() {
			timeRegistration.should.exist;
		});

		it('should update the time registration with the updated company id', function(){
			timeRegistration.companyId.should.eql('company');
		});

		it('should update the time registration with the updated project id', function(){
			timeRegistration.projectId.should.eql('project');
		});

		it('should update the time registration with the updated task', function(){
			timeRegistration.task.should.eql('dev');
		});

		it('should update the time registration with the updated description', function(){
			timeRegistration.description.should.eql('doing some work');
		});

		it('should update the time registration with the updated date', function(){
			timeRegistration.date.numeric.should.eql(20100304);
		});

		it('should update the time registration with the updated from time', function(){
			timeRegistration.from.numeric.should.eql(1015);
		});

		it('should update the time registration with the updated to time', function(){
			timeRegistration.to.numeric.should.eql(1215);
		});
		
		it('should return the id of the time registration', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the company id', function(){
			body.companyId.should.eql('company');
		});

		it('should return the project id', function(){
			body.projectId.should.eql('project');
		});

		it('should return the task', function(){
			body.task.should.eql('dev');
		});

		it('should return the description', function(){
			body.description.should.eql('doing some work');
		});

		it('should return the date', function(){
			body.date.numeric.should.eql(20100304);
		});

		it('should return the from time', function(){
			body.from.numeric.should.eql(1015);
		});

		it('should return the to time', function(){
			body.to.numeric.should.eql(1215);
		});			
	});	 

	describe('When updating a time registration from another tenant', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(uuid.v1(), 'John Doe BVBA', 'Project 1', 'development', 'work', 20001231, 1400, 1359);

			async.series([
				function(done){
					timeRegistration.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: 'company', projectId: 'project', task: 'dev',
								description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			TimeRegistration.findById(timeRegistration.id, function(err, c){
				if(err){ done(err); }

				c.companyId.should.eql('John Doe BVBA');
				c.projectId.should.eql('Project 1');
				c.description.should.eql('work');
				done();
			});
		});		
	});	 
});