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
	Company = require('mongoose').model('Company'),
	Project = require('mongoose').model('Project'),
	testdata = require_infrastructure('testdata');


describe('Public API: TimeRegistration Controller Integration Tests:', function() {

	var company, project, company2, project2;

	before(function(done){
		company = Company.create(testdata.normalAccountId, 'My Company');
		project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
		company2 = Company.create(testdata.normalAccountId, 'My Second Company');
		project2 = Project.create(testdata.normalAccountId, company2.id, 'FM Manager v2', 'Freelance manager v2');

		async.series([
			function(done){
				company.save(done);
			},
			function(done){
				project.save(done);
			},
			function(done){
				company2.save(done);
			},
			function(done){
				project2.save(done);
			}			
		], done);
	});

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
			timeRegistration = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1359);

			async.series([
				function(done){
					company.save(done);
				},
				function(done){
					project.save(done);
				},
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
			body.companyId.should.eql(company.id);
		});	

		it('should return a time registration with the company name', function(){
			body.company.name.should.eql('My Company');
		});	

		it('should return a time registration with the projectId', function(){
			body.projectId.should.eql(project.id);
		});

		it('should return a time registration with the project name', function(){
			body.project.name.should.eql('FM Manager');
		});

		it('should return a time registration with the project description', function(){
			body.project.description.should.eql('Freelance manager');
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
			timeRegistration = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1500);
			
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

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done){
			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20001231, 1500, 1600);
			timeregistration3 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done){
					timeregistration1.save(done);
				},
				function(done){
					timeregistration2.save(done);
				},
				function(done){
					timeregistration3.save(done);
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

		it('should return time registrations with the company name', function(){
			_.where(body, { id: timeregistration1.id })[0].company.name.should.eql('My Company');
		});	

		it('should return time registrations with the project name', function(){
			_.where(body, { id: timeregistration1.id })[0].project.name.should.eql('FM Manager');
		});	

		it('should return time registrations with the project description', function(){
			_.where(body, { id: timeregistration1.id })[0].project.description.should.eql('Freelance manager');
		});	

		it('should return a collection with the first time time registration', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(1);
		});

		it('should return a collection with the second time registration', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration3.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all time registrations by date
	 */
	describe('When all time registrations are requested by date by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/bydate/20141010')
				.expect(401)
				.end(done);
		});
	});

	describe('When all time registrations are requested by date', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done){
			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20001230, 1500, 1600);
			timeregistration3 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done){
					timeregistration1.save(done);
				},
				function(done){
					timeregistration2.save(done);
				},
				function(done){
					timeregistration3.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/bydate/20001231')
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

		it('should return time registrations from the provided date', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(1);
		});

		it('should not return a time registration from another date', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(0);
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration3.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all time registrations by range
	 */
	describe('When time registrations are requested by range by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/byrange/20100202/20100211')
				.expect(401)
				.end(done);
		});
	});

	describe('When time registrations are requested by range', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;

		before(function(done){
			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20100202, 1500, 1600);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20100210, 1400, 1500);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20100211, 1400, 1500);
			timeregistration5 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', 'Doing some work', 20100205, 1400, 1359);
			
			async.series([
				function(done){
					timeregistration1.save(done);
				},
				function(done){
					timeregistration2.save(done);
				},
				function(done){
					timeregistration3.save(done);
				},
				function(done){
					timeregistration4.save(done);
				},
				function(done){
					timeregistration5.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/byrange/20100202/20100210')
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

		it('should return time registrations from the provided date (min)', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});

		it('should return time registrations from the provided date (max)', function() {
			_.where(body, { id: timeregistration3.id }).length.should.eql(1);
		});

		it('should not return a time registration outside the range (min)', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(0);
		});

		it('should not return a time registration outside the range (max)', function() {
			_.where(body, { id: timeregistration4.id }).length.should.eql(0);
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration5.id }).length.should.eql(0);
		});
	});

	/**
	 * Get time registration info
	 */
	describe('When time registrations info is requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/getinfo/20100202/20100210')
				.expect(401)
				.end(done);
		});
	});

	describe('When time registrations info is requested', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;
		var timeregistration6;
		var timeregistration7;

		before(function(done){
			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20110201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20110202, 1500, 1505);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20110210, 1400, 1410);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Meeting', 'Doing some work', 20110202, 1500, 1502);
			timeregistration5 = TimeRegistration.create(testdata.normalAccountId, company2.id, project2.id, 'Dev', 'Doing some work', 20110210, 1400, 1403);
			timeregistration6 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', 'Doing some work', 20110211, 1400, 1500);
			timeregistration7 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', 'Doing some work', 20110205, 1400, 1359);
			
			async.series([
				function(done){
					timeregistration1.save(done);
				},
				function(done){
					timeregistration2.save(done);
				},
				function(done){
					timeregistration3.save(done);
				},
				function(done){
					timeregistration4.save(done);
				},
				function(done){
					timeregistration5.save(done);
				},
				function(done){
					timeregistration6.save(done);
				},
				function(done){
					timeregistration7.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/getinfo/20110202/20110210')
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

		it('should return the time registration length for the given range', function() {
			body.summary.count.should.eql(4);
		});

		it('should return the billable minutes', function() {
			body.summary.billableMinutes.should.eql(20);
		});

		it('should return the unbillable minutes', function() {
			body.summary.unBillableMinutes.should.eql(0);
		});

		it('should return info per task', function() {
			var perTask = _.first(_.where(body.perTask, { companyId: company.id, task: 'Dev' }));

			perTask.companyId.should.eql(company.id);
			perTask.company.name.should.eql('My Company');
			perTask.projectId.should.eql(project.id);
			perTask.project.name.should.eql('FM Manager');
			perTask.task.should.eql('Dev');
			perTask.count.should.eql(2);
			perTask.billableMinutes.should.eql(15);
			perTask.unBillableMinutes.should.eql(0);
		});

		it('should return info per task (other task)', function() {
			var perTask = _.first(_.where(body.perTask, { companyId: company.id, task: 'Meeting' }));

			perTask.companyId.should.eql(company.id);
			perTask.company.name.should.eql('My Company');
			perTask.projectId.should.eql(project.id);
			perTask.project.name.should.eql('FM Manager');
			perTask.task.should.eql('Meeting');
			perTask.count.should.eql(1);
			perTask.billableMinutes.should.eql(2);
			perTask.unBillableMinutes.should.eql(0);
		});	

		it('should return info per task (other company)', function() {

			var perTask = _.first(_.where(body.perTask, { companyId: company2.id, task: 'Dev' }));

			perTask.companyId.should.eql(company2.id);
			perTask.company.name.should.eql('My Second Company');
			perTask.projectId.should.eql(project2.id);
			perTask.project.name.should.eql('FM Manager v2');
			perTask.task.should.eql('Dev');
			perTask.count.should.eql(1);
			perTask.billableMinutes.should.eql(3);
			perTask.unBillableMinutes.should.eql(0);
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
				.send({ companyId: company.id, projectId: project.id, task: 'dev',
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
			timeRegistration.companyId.should.eql(company.id);
		});

		it('should create a time registration with the specified project id', function(){
			timeRegistration.projectId.should.eql(project.id);
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
			body.companyId.should.eql(company.id);
		});

		it('should return the company name', function(){
			body.company.name.should.eql('My Company');
		});

		it('should return the project id', function(){
			body.projectId.should.eql(project.id);
		});

		it('should return the project name', function(){
			body.project.name.should.eql('FM Manager');
		});

		it('should return the project description', function(){
			body.project.description.should.eql('Freelance manager');
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

			timeRegistration = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'development', 'work', 20001231, 1400, 1359);

			async.series([
				function(done){
					timeRegistration.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: company2.id, projectId: project2.id, task: 'dev',
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

		it('should update the time registration with the new company id', function(){
			timeRegistration.companyId.should.eql(company2.id);
		});

		it('should update the time registration with the new project id', function(){
			timeRegistration.projectId.should.eql(project2.id);
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
			body.companyId.should.eql(company2.id);
		});

		it('should return the company name', function(){
			body.company.name.should.eql('My Second Company');
		});

		it('should return the project id', function(){
			body.projectId.should.eql(project2.id);
		});

		it('should return the project name', function(){
			body.project.name.should.eql('FM Manager v2');
		});

		it('should return the project description', function(){
			body.project.description.should.eql('Freelance manager v2');
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

			timeRegistration = TimeRegistration.create(uuid.v1(), company.id, project.id, 'development', 'work', 20001231, 1400, 1359);

			async.series([
				function(done){
					timeRegistration.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: company.id, projectId: project.id, task: 'dev',
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

				c.companyId.should.eql(company.id);
				c.projectId.should.eql(project.id);
				c.description.should.eql('work');
				done();
			});
		});		
	});	 
});