'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/project'),
	config = require_config(),
	uuid = require('node-uuid'),
	Project = require('mongoose').model('Project'),
	Company = require('mongoose').model('Company'),
	testdata = require_infrastructure('testdata');


describe('Public API: Project Controller Integration Tests:', function() {

	var company;

	before(function(done) {

		company = Company.create(testdata.normalAccountId, '2', 'My Company');

		async.series([
			function(done) {

				company.save(done);
			}		
		], done);
	});

	/**
	 * Get by id
	 */
	describe('When a project is requested by id by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/projects/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a project is requested by id', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project.changeTasks([
				{ name: 'Development', defaultRateInCents: 50 },		
				{ name: 'Analyse', defaultRateInCents: 0 },
				{ name: 'Meeting', defaultRateInCents: 0 }
			]);
			
			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.get('/api/public/projects/' + project.id)
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
		
		it('should return the id of the project', function() {
			body.id.should.eql(project.id);
		});

		it('should return the project with the linked company id', function() {

			body.companyId.should.eql(company.id);
		});		

		it('should return the project with the linked company name', function() {

			body.company.name.should.eql('My Company');
		});				

		it('should return the project with the name', function() {

			body.name.should.eql('FM Manager');
		});		

		it('should return the project with the description', function() {

			body.description.should.eql('Freelance manager');
		});	

		it('should return the project with the tasks', function() {

			body.tasks[0].name.should.eql('Development');
			body.tasks[0].defaultRateInCents.should.eql(50);

			body.tasks[1].name.should.eql('Analyse');
			body.tasks[1].defaultRateInCents.should.eql(0);

			body.tasks[2].name.should.eql('Meeting');
			body.tasks[2].defaultRateInCents.should.eql(0);
		});	

		it('should return if the tasks are billable', function() {

			body.tasks[0].billable.should.eql(true);
			body.tasks[1].billable.should.eql(false);
			body.tasks[2].billable.should.eql(false);
		});

		it('should return if the project is hidden', function() {

			body.hidden.should.eql(false);
		});							
	});

	describe('When a project is requested by id by another tenant', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');
			
			async.series([
				function(done) {

					project.save(done);
				},
			], done);
		});
		
		it('should not return the project', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/companies/' + project.id)
				.set('Authorization', testdata.normalAccountToken)
				.expect(404)
				.expect('Content-Type', /html/)
				.end(done);
		});					
	});

	/**
	 * Get all projects
	 */
	describe('When all projects are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/projects')
				.expect(401)
				.end(done);
		});
	});

	describe('When all projects are requested', function() {

		var response;
		var body;

		var project1;
		var project2;
		var project3;

		before(function(done) {

			project1 = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project2 = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project3 = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');
			
			async.series([
				function(done) {

					project1.save(done);
				},
				function(done) {

					project2.save(done);
				},
				function(done) {

					project3.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/projects')
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

		it('should return a projects with the company name', function() {
			_.where(body, { id: project1.id })[0].company.name.should.eql('My Company');
		});
		
		it('should return a collection with the first project', function() {
			_.where(body, { id: project1.id }).length.should.eql(1);
		});

		it('should return a collection with the second project', function() {
			_.where(body, { id: project2.id }).length.should.eql(1);
		});

		it('should not return projects from another tenant', function() {
			_.where(body, { id: project3.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all active projects
	 */
	describe('When all active projects are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/projects/active')
				.expect(401)
				.end(done);
		});
	});

	describe('When all active projects are requested', function() {

		var response;
		var body;

		var project1;
		var project2;
		var project3;

		before(function(done) {

			project1 = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project2 = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project3 = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project3.hide();
			
			async.series([
				function(done) {

					project1.save(done);
				},
				function(done) {

					project2.save(done);
				},
				function(done) {

					project3.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/projects/active')
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

		it('should return a collection with the first project', function() {
			_.where(body, { id: project1.id }).length.should.eql(1);
		});

		it('should return a collection with the second project', function() {
			_.where(body, { id: project2.id }).length.should.eql(1);
		});

		it('should not return hidden projects', function() {
			_.where(body, { id: project3.id }).length.should.eql(0);
		});
	});

	/**
	 * Create
	 */
	describe('When a project is created by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/projects')
				.send({ companyId: company.id, name: 'FM Manager', description: 'Freelance manager' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a project', function() {

		var response;
		var body;
		var project;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/projects')
				.set('Authorization', testdata.normalAccountToken)
				.send({ companyId: company.id, name: 'FM Manager', description: 'Freelance manager' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Project.findById(body.id, function(err, c) {

						project = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			project.should.exist;
		});

		it('should create a project for the logged in user', function() {

			project.tenant.should.eql(testdata.normalAccountId);
		});

		it('should create a project with the specified company id', function() {

			project.companyId.should.eql(company.id);
		});		

		it('should create a project with the specified name', function() {

			project.name.should.eql('FM Manager');
		});

		it('should create a project with the specified description', function() {

			project.description.should.eql('Freelance manager');
		});				
		
		it('should return the id of the project', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function() {

			body.name.should.eql('FM Manager');
		});		

		it('should return the description', function() {

			body.description.should.eql('Freelance manager');
		});		

		it('should return the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});			

		it('should return the company id', function() {

			body.companyId.should.eql(company.id);
		});				
	});	 

	/**
	 * Update
	 */
	describe('When a project is updated by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/projects/' + uuid.v1())
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating a project', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Hello', description: 'There' })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Project.findById(body.id, function(err, c) {

								project = c;
								done();
							});
						});
				}
			], done);
		});

		it('should be saved in the database', function() {
			project.should.exist;
		});

		it('should update the project with the specified name', function() {

			project.name.should.eql('Hello');
		});

		it('should update the project with the specified description', function() {

			project.description.should.eql('There');
		});
		
		it('should return the id of the project', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function() {

			body.name.should.eql('Hello');
		});		

		it('should return the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});			

		it('should return the description', function() {

			body.description.should.eql('There');
		});			
	});	 

	describe('When updating a project from another tenant', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Hello', description: 'There' })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Project.findById(project.id, function(err, c) {

				if(err) {
 done(err); }

				c.name.should.eql('FM Manager');
				done();
			});
		});		
	});	

	/**
	 * Hide
	 */
	describe('When a project is hidden by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/projects/' + uuid.v1() + '/hide')
				.send()
				.expect(401)
				.end(done);
		});
	});

	describe('When hiding a project', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id + '/hide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Project.findById(body.id, function(err, c) {

								project = c;
								done();
							});
						});
				}
			], done);
		});

		it('should hide the project', function() {

			project.hidden.should.eql(true);
		});

		it('should return the name', function() {

			body.name.should.eql('FM Manager');
		});		

		it('should return the description', function() {

			body.description.should.eql('Freelance manager');
		});		

		it('should return the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});			

		it('should return the company id', function() {

			body.companyId.should.eql(company.id);
		});			
	});	 

	describe('When hiding a project from another tenant', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id + '/hide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Project.findById(project.id, function(err, c) {

				if(err) {
 done(err); }

				c.hidden.should.eql(false);
				done();
			});
		});		
	});		


	/**
	 * Hide
	 */
	describe('When a project is unhidden by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/projects/' + uuid.v1() + '/unhide')
				.send()
				.expect(401)
				.end(done);
		});
	});

	describe('When hiding a project', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');
			project.hide();

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id + '/unhide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Project.findById(body.id, function(err, c) {

								project = c;
								done();
							});
						});
				}
			], done);
		});

		it('should unhide the project', function() {

			project.hidden.should.eql(false);
		});

		it('should return the name', function() {

			body.name.should.eql('FM Manager');
		});		

		it('should return the description', function() {

			body.description.should.eql('Freelance manager');
		});		

		it('should return the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});			

		it('should return the company id', function() {

			body.companyId.should.eql(company.id);
		});			
	});	 

	describe('When hiding a project from another tenant', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');
			project.hide();

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id + '/unhide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Project.findById(project.id, function(err, c) {

				if(err) {
 done(err); }

				c.hidden.should.eql(true);
				done();
			});
		});		
	});	

	/**
	 * Change tasks
	 */
	describe('When a project tasks are changed by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/projects/' + uuid.v1() + '/changetasks')
				.send([{ name: 'Development' }])
				.expect(401)
				.end(done);
		});
	});

	describe('When updating a projects tasks', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(testdata.normalAccountId, company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id + '/changetasks')
						.set('Authorization', testdata.normalAccountToken)
						.send([
							{ name: 'Development', defaultRateInCents: 50 },
							{ name: 'Sleeping', defaultRateInCents: 0 }
						])
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Project.findById(body.id, function(err, c) {

								project = c;
								done();
							});
						});
				}
			], done);
		});

		it('should update an existing task', function() {

			project.tasks[0].name.should.eql('Development');
			project.tasks[0].defaultRateInCents.should.eql(50);
		});

		it('should create a new task', function() {

			project.tasks[1].name.should.eql('Sleeping');
			project.tasks[1].defaultRateInCents.should.eql(0);
		});

		it('should remove unexisting tasks', function() {

			project.tasks.length.should.eql(2);
		});

		it('should return the name', function() {

			body.name.should.eql('FM Manager');
		});		

		it('should return the companyId', function() {

			body.companyId.should.eql(company.id);
		});	

		it('should return the company name', function() {

			body.company.name.should.eql('My Company');
		});			

		it('should return the description', function() {

			body.description.should.eql('Freelance manager');
		});			
	});	 

	describe('When updating a project tasks from another tenant', function() {

		var response;
		var body;
		var project;

		before(function(done) {

			project = Project.create(uuid.v1(), company.id, 'FM Manager', 'Freelance manager');

			async.series([
				function(done) {

					project.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/projects/' + project.id)
						.set('Authorization', testdata.normalAccountToken)
						.send([
							{ name: 'Development', defaultRateInCents: 50 },
							{ name: 'Sleeping', defaultRateInCents: 0 }
						])
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Project.findById(project.id, function(err, c) {

				if(err) { done(err); }

				c.tasks.length.should.eql(3);
				done();
			});
		});		
	});	
});