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

	before(function(done) {

		company = Company.create(testdata.normalAccountId, '3', 'My Company');
		project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
		company2 = Company.create(testdata.normalAccountId, '4', 'My Second Company');
		project2 = Project.create(testdata.normalAccountId, company2.id, 'FM Manager v2', 'Freelance manager v2');

		async.series([
			function(done) {

				company.save(done);
			},
			function(done) {

				project.save(done);
			},
			function(done) {

				company2.save(done);
			},
			function(done) {

				project2.save(done);
			}			
		], done);
	});

	/**
	 * Get by id
	 */
	describe('When a time registration is requested by id by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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

		before(function(done) {

			timeRegistration = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20001231, 1400, 1359);

			async.series([
				function(done) {

					timeRegistration.save(done);
				},
				function(done) {


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

		it('should return a time registration with the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return a time registration with the company name', function() {

			body.company.name.should.eql('My Company');
		});	

		it('should return a time registration with the projectId', function() {

			body.projectId.should.eql(project.id);
		});

		it('should return a time registration with the project name', function() {

			body.project.name.should.eql('FM Manager');
		});

		it('should return a time registration with the project description', function() {

			body.project.description.should.eql('Freelance manager');
		});				

		it('should return a time registration with the task', function() {

			body.task.should.eql('Dev');
		});

		it('should return a time registration with the description', function() {

			body.description.should.eql('Doing some work');
		});

		it('should return if the time registration is billable', function() {

			body.billable.should.eql(true);
		});

		it('should return a time registration with the date', function() {

			body.date.year.should.eql(2000);
			body.date.month.should.eql(12);
			body.date.day.should.eql(31);
			body.date.numeric.should.eql(20001231);
		});

		it('should return a time registration with the from time', function() {

			body.from.hour.should.eql(14);
			body.from.minutes.should.eql(0);
			body.from.numeric.should.eql(1400);
		});

		it('should return a time registration with the to time', function() {

			body.to.hour.should.eql(13);
			body.to.minutes.should.eql(59);
			body.to.numeric.should.eql(1359);
		});		

		it('should return a time registration with the total minutes', function() {

			body.totalMinutes.should.eql(1439);
		});		
	});

	describe('When a time registration is requested by id by another tenant', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', true, 'Doing some work', 20001231, 1400, 1500);
			
			async.series([
				function(done) {

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
	describe('When all time registrations are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1500, 1600);
			timeregistration3 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					
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

		it('should return time registrations with the company name', function() {

			_.where(body, { id: timeregistration1.id })[0].company.name.should.eql('My Company');
		});	

		it('should return time registrations with the project name', function() {

			_.where(body, { id: timeregistration1.id })[0].project.name.should.eql('FM Manager');
		});	

		it('should return time registrations with the project description', function() {

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
	 * Get last x time registrations grouped by description
	 */
	describe('When the last time registrations grouped by description are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/getlastgroupedbydescription/10')
				.expect(401)
				.end(done);
		});
	});

	describe('When the last 2 time registrations grouped by description are requested', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work 1', 20001231, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work 2', 20001231, 1400, 1500);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work 3', 20001231, 1400, 1500);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work 3', 20001231, 1500, 1600);
			timeregistration5 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1400, 1359);
			
			timeregistration1.createdOn = new Date(2050, 1, 1, 1, 1, 1, 6);
			timeregistration2.createdOn = new Date(2050, 1, 1, 1, 1, 1, 7);
			timeregistration3.createdOn = new Date(2050, 1, 1, 1, 1, 1, 8);
			timeregistration4.createdOn = new Date(2050, 1, 1, 1, 1, 1, 9);
			timeregistration5.createdOn = new Date(2050, 1, 1, 1, 1, 1, 10);

			async.series([
				function(done) {
					timeregistration1.save(done);
				},
				function(done) {
					timeregistration2.save(done);
				},
				function(done) {
					timeregistration3.save(done);
				},
				function(done) {
					timeregistration4.save(done);
				},
				function(done) {
					timeregistration5.save(done);
				},
				function(done) {
					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/getlastgroupedbydescription/2')
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

		it('should return 2 time registrations with the company name', function() {

			_.size(body).should.eql(2);
		});	

		it('should return the last time registrations grouped by description', function() {

			body[0].description.should.eql('Doing some work 3');
			body[1].description.should.eql('Doing some work 2');
		});	

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration5.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all time registrations by date
	 */
	describe('When all time registrations are requested by date by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20001230, 1500, 1600);
			timeregistration3 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20001231, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					
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
	describe('When time registrations are requested by range by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100202, 1500, 1600);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100210, 1400, 1500);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100211, 1400, 1500);
			timeregistration5 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20100205, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					timeregistration4.save(done);
				},
				function(done) {

					timeregistration5.save(done);
				},
				function(done) {

					
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
	 * Search time registrations
	 */
	describe('When time registrations are searched by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/search')
				.expect(401)
				.end(done);
		});
	});

	describe('When time registrations are searched (no filter)', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100202, 1500, 1600);
			timeregistration3 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20100205, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/search')
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

		it('should return all time registrations (1)', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(1);
		});

		it('should return all time registration (2)', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration3.id }).length.should.eql(0);
		});
	});

	describe('When time registrations are searched (date range filter)', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100202, 1500, 1600);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100210, 1400, 1500);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100211, 1400, 1500);
			timeregistration5 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20100205, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					timeregistration4.save(done);
				},
				function(done) {

					timeregistration5.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/search?from=20100202&to=20100210')
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

	describe('When time registrations are searched (project filter)', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project2.id, 'Dev', false, 'Doing some work', 20100202, 1500, 1600);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/search?project=' + project.id)
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

		it('should return time registrations from the provided project', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(1);
		});

		it('should not return a time registration from another project', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(0);
		});
	});

	describe('When time registrations are searched (invoiced filter)', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project2.id, 'Dev', false, 'Doing some work', 20100202, 1500, 1600);
			timeregistration2.markInvoiced();

			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/search?invoiced=true')
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

		it('should return not return uninvoiced time registrations', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(0);
		});

		it('should return invoiced time registration', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});
	});

	describe('When time registrations are searched (billable filter)', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project2.id, 'Dev', true, 'Doing some work', 20100202, 1500, 1600);

			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/search?billable=true')
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

		it('should return not return uninvoiced time registrations', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(0);
		});

		it('should return invoiced time registration', function() {
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});
	});

	/**
	 * Get all uninvoiced time registrations
	 */
	describe('When uninvoiced time registrations are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/uninvoiced')
				.expect(401)
				.end(done);
		});
	});

	describe('When uninvoiced time registrations are requested', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20100201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20100202, 1500, 1600);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20100210, 1400, 1500);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', false, 'Doing some work', 20100211, 1400, 1500);
			timeregistration5 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', false, 'Doing some work', 20100205, 1400, 1359);
			
			timeregistration3.markInvoiced('invoiceId');

			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {


					timeregistration3.save(done);
				},
				function(done) {

					timeregistration4.save(done);
				},
				function(done) {

					timeregistration5.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/uninvoiced')
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

		it('should return uninvoiced time registrations', function() {
			_.where(body, { id: timeregistration1.id }).length.should.eql(1);
			_.where(body, { id: timeregistration2.id }).length.should.eql(1);
		});

		it('should not return unbillable time registrations', function() {
			_.where(body, { id: timeregistration3.id }).length.should.eql(0);
		});

		it('should not return invoiced time registrations', function() {
			_.where(body, { id: timeregistration4.id }).length.should.eql(0);
		});

		it('should not return time registrations from another tenant', function() {
			_.where(body, { id: timeregistration5.id }).length.should.eql(0);
		});
	});

	/**
	 * Get time registration info
	 */
	describe('When time registrations info is requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/getinfoforperiod/20100202/20100210')
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

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20110201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20110202, 1500, 1505);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20110210, 1400, 1410);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Meeting', true, 'Doing some work', 20110202, 1500, 1502);
			timeregistration5 = TimeRegistration.create(testdata.normalAccountId, company2.id, project2.id, 'Dev', true, 'Doing some work', 20110210, 1400, 1403);
			timeregistration6 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20110211, 1400, 1500);
			timeregistration7 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', true, 'Doing some work', 20110205, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					timeregistration4.save(done);
				},
				function(done) {

					timeregistration5.save(done);
				},
				function(done) {

					timeregistration6.save(done);
				},
				function(done) {

					timeregistration7.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/getinfoforperiod/20110202/20110210')
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

		it('should return the time registration count for the given range', function() {
			body.count.should.eql(4);
		});

		it('should return the billable minutes', function() {
			body.billableMinutes.should.eql(20);
		});

		it('should return the unbillable minutes', function() {
			body.unBillableMinutes.should.eql(0);
		});
	});

	/**
	 * Get time registration info per task
	 */
	describe('When time registrations info per task is requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/timeregistrations/getinfoforperiodpertask/20100202/20100210')
				.expect(401)
				.end(done);
		});
	});

	describe('When time registrations info per task is requested', function() {

		var response;
		var body;

		var timeregistration1;
		var timeregistration2;
		var timeregistration3;
		var timeregistration4;
		var timeregistration5;
		var timeregistration6;
		var timeregistration7;

		before(function(done) {

			timeregistration1 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20150201, 1400, 1500);
			timeregistration2 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20150202, 1500, 1505);
			timeregistration3 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20150210, 1400, 1410);
			timeregistration4 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Meeting', true, 'Doing some work', 20150202, 1500, 1502);
			timeregistration5 = TimeRegistration.create(testdata.normalAccountId, company2.id, project2.id, 'Dev', true, 'Doing some work', 20150210, 1400, 1403);
			timeregistration6 = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'Dev', true, 'Doing some work', 20150211, 1400, 1500);
			timeregistration7 = TimeRegistration.create(uuid.v1(), company.id, project.id, 'Dev', true, 'Doing some work', 20150205, 1400, 1359);
			
			async.series([
				function(done) {

					timeregistration1.save(done);
				},
				function(done) {

					timeregistration2.save(done);
				},
				function(done) {

					timeregistration3.save(done);
				},
				function(done) {

					timeregistration4.save(done);
				},
				function(done) {

					timeregistration5.save(done);
				},
				function(done) {

					timeregistration6.save(done);
				},
				function(done) {

					timeregistration7.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/timeregistrations/getinfoforperiodpertask/20150202/20150210')
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

		it('should return info per task', function() {
			var perTask = _.find(body, { companyId: company.id, task: 'Dev' });

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
			var perTask = _.find(body, { companyId: company.id, task: 'Meeting' });

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

			var perTask = _.find(body, { companyId: company2.id, task: 'Dev' });

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
	describe('When a time registration is created by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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
				.send({ companyId: company.id, projectId: project.id, task: 'dev', billable: false,
						description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					TimeRegistration.findById(body.id, function(err, c) {

						timeRegistration = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			timeRegistration.should.exist;
		});

		it('should create a time registration with the specified company id', function() {

			timeRegistration.companyId.should.eql(company.id);
		});

		it('should create a time registration with the specified project id', function() {

			timeRegistration.projectId.should.eql(project.id);
		});

		it('should create a time registration with the specified task', function() {

			timeRegistration.task.should.eql('dev');
		});

		it('should create a time registration with the specified billable property', function() {

			timeRegistration.billable.should.eql(false);
		});

		it('should create a time registration with the specified description', function() {

			timeRegistration.description.should.eql('doing some work');
		});

		it('should create a time registration with the specified date', function() {

			timeRegistration.date.numeric.should.eql(20100304);
		});

		it('should create a time registration with the specified from time', function() {

			timeRegistration.from.numeric.should.eql(1015);
		});

		it('should create a time registration with the specified to time', function() {

			timeRegistration.to.numeric.should.eql(1215);
		});

		it('should create a time registration for the logged in user', function() {

			timeRegistration.tenant.should.eql(testdata.normalAccountId);
		});
		
		it('should return the id of the time registration', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the company id', function() {

			body.companyId.should.eql(company.id);
		});

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});

		it('should return the project id', function() {

			body.projectId.should.eql(project.id);
		});

		it('should return the project name', function() {

			body.project.name.should.eql('FM Manager');
		});

		it('should return the project description', function() {

			body.project.description.should.eql('Freelance manager');
		});

		it('should return the task', function() {

			body.task.should.eql('dev');
		});

		it('should return the billable property', function() {

			body.billable.should.eql(false);
		});		

		it('should return the description', function() {

			body.description.should.eql('doing some work');
		});

		it('should return the date', function() {

			body.date.numeric.should.eql(20100304);
		});

		it('should return the from time', function() {

			body.from.numeric.should.eql(1015);
		});

		it('should return the to time', function() {

			body.to.numeric.should.eql(1215);
		});
	});	

	/**
	 * Create Multiple
	 */
	describe('When multiple time registrations are created by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/timeregistrations/multiple')
				.send([{ companyId: company.id, projectId: project.id, task: 'dev', billable: true, description: 'doing some work', date: 20100304, from: 1015, to: 1215 },
					{ companyId: company.id, projectId: project.id, task: 'meeting', billable: false, description: 'doing some more work', date: 20100404, from: 1115, to: 1315 }])
				.expect(401)
				.end(done);
		});
	});

	describe('When creating multiple time registrations', function() {

		var response;
		var body;
		var timeRegistration1, timeRegistration2;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/timeregistrations/multiple')
				.set('Authorization', testdata.normalAccountToken)
				.send([{ companyId: company.id, projectId: project.id, task: 'dev', billable: true, description: 'doing some work', date: 20100304, from: 1015, to: 1215 },
					{ companyId: company.id, projectId: project.id, task: 'meeting', billable: false, description: 'doing some more work', date: 20100404, from: 1115, to: 1315 }])
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					async.series([
						function(done) {

							TimeRegistration.findById(body[0].id, function(err, c) {

								timeRegistration1 = c;
								done();
							});
						},
						function(done) {

							TimeRegistration.findById(body[1].id, function(err, c) {

								timeRegistration2 = c;
								done();
							});
					}], done);
				});
		});

		// test some random properties

		it('tr1 should be saved in the database', function() {
			timeRegistration1.should.exist;
		});

		it('tr2 should be saved in the database', function() {
			timeRegistration2.should.exist;
		});

		it('should create a time registration (1) with the specified task', function() {

			timeRegistration1.task.should.eql('dev');
		});

		it('should create a time registration (2) with the specified task', function() {

			timeRegistration2.task.should.eql('meeting');
		});

		it('should create a time registration (1) with the specified description', function() {

			timeRegistration1.description.should.eql('doing some work');
		});

		it('should create a time registration (2) with the specified description', function() {

			timeRegistration2.description.should.eql('doing some more work');
		});

		it('should create a time registration (1) with the specified billable property', function() {

			timeRegistration1.billable.should.eql(true);
		});

		it('should create a time registration (2) with the specified billable property', function() {

			timeRegistration2.billable.should.eql(false);
		});

		it('should return the company id (1)', function() {

			body[0].companyId.should.eql(company.id);
		});

		it('should return the company id (2)', function() {

			body[1].companyId.should.eql(company.id);
		});

		it('should return the company name (1)', function() {

			body[0].company.name.should.eql('My Company');
		});

		it('should return the company name (2)', function() {

			body[1].company.name.should.eql('My Company');
		});

		it('should return the to time (1)', function() {

			body[0].to.numeric.should.eql(1215);
		});

		it('should return the to time (2)', function() {

			body[1].to.numeric.should.eql(1315);
		});		
	});	 
 

	/**
	 * Update
	 */
	describe('When a time registration is updated by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

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

			timeRegistration = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'development', false, 'work', 20001231, 1400, 1359);

			async.series([
				function(done) {

					timeRegistration.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: company2.id, projectId: project2.id, task: 'dev', billable: true,
								description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							TimeRegistration.findById(body.id, function(err, c) {

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

		it('should update the time registration with the new company id', function() {

			timeRegistration.companyId.should.eql(company2.id);
		});

		it('should update the time registration with the new project id', function() {

			timeRegistration.projectId.should.eql(project2.id);
		});

		it('should update the time registration with the updated task', function() {

			timeRegistration.task.should.eql('dev');
		});

		it('should update the time registration with the updated billable property', function() {

			timeRegistration.billable.should.eql(true);
		});

		it('should update the time registration with the updated description', function() {

			timeRegistration.description.should.eql('doing some work');
		});

		it('should update the time registration with the updated date', function() {

			timeRegistration.date.numeric.should.eql(20100304);
		});

		it('should update the time registration with the updated from time', function() {

			timeRegistration.from.numeric.should.eql(1015);
		});

		it('should update the time registration with the updated to time', function() {

			timeRegistration.to.numeric.should.eql(1215);
		});
		
		it('should return the id of the time registration', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the company id', function() {

			body.companyId.should.eql(company2.id);
		});

		it('should return the company name', function() {

			body.company.name.should.eql('My Second Company');
		});

		it('should return the project id', function() {

			body.projectId.should.eql(project2.id);
		});

		it('should return the project name', function() {

			body.project.name.should.eql('FM Manager v2');
		});

		it('should return the project billable property', function() {

			body.billable.should.eql(true);
		});

		it('should return the project description', function() {

			body.project.description.should.eql('Freelance manager v2');
		});

		it('should return the task', function() {

			body.task.should.eql('dev');
		});

		it('should return the description', function() {

			body.description.should.eql('doing some work');
		});

		it('should return the date', function() {

			body.date.numeric.should.eql(20100304);
		});

		it('should return the from time', function() {

			body.from.numeric.should.eql(1015);
		});

		it('should return the to time', function() {

			body.to.numeric.should.eql(1215);
		});			
	});	 

	describe('When updating a time registration from another tenant', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(uuid.v1(), company.id, project.id, 'development', false, 'work', 20001231, 1400, 1359);

			async.series([
				function(done) {

					timeRegistration.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ companyId: company.id, projectId: project.id, task: 'dev', billable: true,
								description: 'doing some work', date: 20100304, from: 1015, to: 1215 })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			TimeRegistration.findById(timeRegistration.id, function(err, c) {

				if(err) { done(err); }

				c.companyId.should.eql(company.id);
				c.projectId.should.eql(project.id);
				c.description.should.eql('work');
				done();
			});
		});		
	});	 

	/**
	 * Delete
	 */
	describe('When a time registration is deleted by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.delete('/api/public/timeregistrations/' + uuid.v1())
				.send()
				.expect(401)
				.end(done);
		});
	});

	describe('When deleting a time registration', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(testdata.normalAccountId, company.id, project.id, 'development', false, 'work', 20001231, 1400, 1359);

			async.series([
				function(done) {

					timeRegistration.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.delete('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							TimeRegistration.findById(timeRegistration.id, function(err, c) {

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

		it('should delete the time registration', function() {

			timeRegistration.deleted.should.eql(true);
		});

		it('should return the id of the deleted item', function() {

			body.deleted.should.eql(timeRegistration.id);
		});			
	});	 

	describe('When deleting a time registration from another tenant', function() {

		var response;
		var body;
		var timeRegistration;

		before(function(done) {

			timeRegistration = TimeRegistration.create(uuid.v1(), company.id, project.id, 'development', false, 'work', 20001231, 1400, 1359);

			async.series([
				function(done) {

					timeRegistration.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.delete('/api/public/timeregistrations/' + timeRegistration.id)
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			TimeRegistration.findById(timeRegistration.id, function(err, c) {

				if(err) { done(err); }

				c.deleted.should.eql(false);
				done();
			});
		});		
	});	 
});