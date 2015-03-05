'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/template'),
	config = require_config(),
	uuid = require('node-uuid'),
	Template = require('mongoose').model('Template'),
	testdata = require_infrastructure('testdata');


describe('Public API: Template Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When a template is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/templates/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a template is requested by id', function() {

		var response;
		var body;
		var template;

		before(function(done){
			template = Template.create(testdata.normalAccountId, 'template name', 'template content');
			
			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.get('/api/public/templates/' + template.id)
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
		
		it('should return the id of the template', function() {
			body.id.should.eql(template.id);
		});			

		it('should return the template with the name', function(){
			body.name.should.eql('template name');
		});		

		it('should return the template with the content', function(){
			body.content.should.eql('template content');
		});	

		it('should return if the template is hidden', function(){
			body.hidden.should.eql(false);
		});							
	});

	describe('When a template is requested by id by another tenant', function() {

		var response;
		var body;
		var template;

		before(function(done){
			template = Template.create(uuid.v1(), 'template name', 'template content');
			
			async.series([
				function(done){
					template.save(done);
				},
			], done);
		});
		
		it('should not return the template', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/companies/' + template.id)
				.set('Authorization', testdata.normalAccountToken)
				.expect(404)
				.expect('Content-Type', /html/)
				.end(done);
		});					
	});

	/**
	 * Get all templates
	 */
	describe('When all templates are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/templates')
				.expect(401)
				.end(done);
		});
	});

	describe('When all templates are requested', function() {

		var response;
		var body;

		var template1;
		var template2;
		var template3;

		before(function(done){
			template1 = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template2 = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template3 = Template.create(uuid.v1(), 'template name', 'template content');
			
			async.series([
				function(done){
					template1.save(done);
				},
				function(done){
					template2.save(done);
				},
				function(done){
					template3.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/templates')
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

		it('should return a collection with the first template', function() {
			_.where(body, { id: template1.id }).length.should.eql(1);
		});

		it('should return a collection with the second template', function() {
			_.where(body, { id: template2.id }).length.should.eql(1);
		});

		it('should not return templates from another tenant', function() {
			_.where(body, { id: template3.id }).length.should.eql(0);
		});
	});

	/**
	 * Get all active templates
	 */
	describe('When all active templates are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/templates/active')
				.expect(401)
				.end(done);
		});
	});

	describe('When all active templates are requested', function() {

		var response;
		var body;

		var template1;
		var template2;
		var template3;

		before(function(done){
			template1 = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template2 = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template3 = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template3.hide();
			
			async.series([
				function(done){
					template1.save(done);
				},
				function(done){
					template2.save(done);
				},
				function(done){
					template3.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/templates/active')
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

		it('should return a collection with the first template', function() {
			_.where(body, { id: template1.id }).length.should.eql(1);
		});

		it('should return a collection with the second template', function() {
			_.where(body, { id: template2.id }).length.should.eql(1);
		});

		it('should not return hidden templates', function() {
			_.where(body, { id: template3.id }).length.should.eql(0);
		});
	});

	/**
	 * Create
	 */
	describe('When a template is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/templates')
				.send({ name: 'template name', content: 'template content' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a template', function() {

		var response;
		var body;
		var template;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/templates')
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'template name', content: 'template content' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Template.findById(body.id, function(err, c){
						template = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			template.should.exist;
		});

		it('should create a template for the logged in user', function(){
			template.tenant.should.eql(testdata.normalAccountId);
		});

		it('should create a template with the specified name', function(){
			template.name.should.eql('template name');
		});

		it('should create a template with the specified content', function(){
			template.content.should.eql('template content');
		});				
		
		it('should return the id of the template', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('template name');
		});		

		it('should return the content', function(){
			body.content.should.eql('template content');
		});			
	});	 

	/**
	 * Update
	 */
	describe('When a template is updated by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/templates/' + uuid.v1())
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating a template', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(testdata.normalAccountId, 'template name', 'template content');

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Hello', content: 'There' })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Template.findById(body.id, function(err, c){
								template = c;
								done();
							});
						});
				}
			], done);
		});

		it('should be saved in the database', function() {
			template.should.exist;
		});

		it('should update the template with the specified name', function(){
			template.name.should.eql('Hello');
		});

		it('should update the template with the specified content', function(){
			template.content.should.eql('There');
		});
		
		it('should return the id of the template', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('Hello');
		});	

		it('should return the content', function(){
			body.content.should.eql('There');
		});			
	});	 

	describe('When updating a template from another tenant', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(uuid.v1(), 'template name', 'template content');

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Hello', content: 'There' })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Template.findById(template.id, function(err, c){
				if(err){ done(err); }

				c.name.should.eql('template name');
				done();
			});
		});		
	});	

	/**
	 * Hide
	 */
	describe('When a template is hidden by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/templates/' + uuid.v1() + '/hide')
				.send()
				.expect(401)
				.end(done);
		});
	});

	describe('When hiding a template', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(testdata.normalAccountId, 'template name', 'template content');

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id + '/hide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Template.findById(body.id, function(err, c){
								template = c;
								done();
							});
						});
				}
			], done);
		});

		it('should hide the template', function(){
			template.hidden.should.eql(true);
		});

		it('should return the name', function(){
			body.name.should.eql('template name');
		});		

		it('should return the content', function(){
			body.content.should.eql('template content');
		});		
	});	 

	describe('When hiding a template from another tenant', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(uuid.v1(), 'template name', 'template content');

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id + '/hide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Template.findById(template.id, function(err, c){
				if(err){ done(err); }

				c.hidden.should.eql(false);
				done();
			});
		});		
	});		


	/**
	 * Hide
	 */
	describe('When a template is unhidden by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/templates/' + uuid.v1() + '/unhide')
				.send()
				.expect(401)
				.end(done);
		});
	});

	describe('When hiding a template', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(testdata.normalAccountId, 'template name', 'template content');
			template.hide();

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id + '/unhide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Template.findById(body.id, function(err, c){
								template = c;
								done();
							});
						});
				}
			], done);
		});

		it('should unhide the template', function(){
			template.hidden.should.eql(false);
		});

		it('should return the name', function(){
			body.name.should.eql('template name');
		});		

		it('should return the content', function(){
			body.content.should.eql('template content');
		});		
	});	 

	describe('When hiding a template from another tenant', function() {

		var response;
		var body;
		var template;

		before(function(done) {

			template = Template.create(uuid.v1(), 'template name', 'template content');
			template.hide();

			async.series([
				function(done){
					template.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/templates/' + template.id + '/unhide')
						.set('Authorization', testdata.normalAccountToken)
						.send()
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Template.findById(template.id, function(err, c){
				if(err){ done(err); }

				c.hidden.should.eql(true);
				done();
			});
		});		
	});	
});