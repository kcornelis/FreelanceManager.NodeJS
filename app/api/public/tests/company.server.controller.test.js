'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/company'),
	config = require_config(),
	uuid = require('node-uuid'),
	Company = require('mongoose').model('Company'),
	testdata = require_infrastructure('testdata');


describe('Public API: Company Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When a company is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/companies/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a company is requested by id', function() {

		var response;
		var body;
		var company;

		before(function(done){
			company = Company.create(testdata.normalAccountId, 'John BVBA');
			
			async.series([
				function(done){
					company.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.get('/api/public/companies/' + company.id)
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
		
		it('should return the id of the company', function() {
			body.id.should.eql(company.id);
		});

		it('should return a company with the name', function(){
			body.name.should.eql('John BVBA');
		});				
	});

	describe('When a company is requested by id by another tenant', function() {

		var response;
		var body;
		var company;

		before(function(done){
			company = Company.create(uuid.v1(), 'John BVBA');
			
			async.series([
				function(done){
					company.save(done);
				}
			], done);
		});
		
		it('should not return the company', function(done) {
			request('http://localhost:' + config.port)
				.get('/api/public/companies/' + company.id)
				.set('Authorization', testdata.normalAccountToken)
				.expect(404)
				.expect('Content-Type', /html/)
				.end(done);
		});
	});

	/**
	 * Get all companies
	 */
	describe('When all companies are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/companies')
				.expect(401)
				.end(done);
		});
	});

	describe('When all companies are requested', function() {

		var response;
		var body;

		var company1;
		var company2;
		var company3;

		before(function(done){
			company1 = Company.create(testdata.normalAccountId, 'John BVBA');
			company2 = Company.create(testdata.normalAccountId, 'John BVBA');
			company3 = Company.create(uuid.v1(), 'John BVBA');
			
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
						.get('/api/public/companies')
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

		it('should return a collection with the first company', function() {
			_.where(body, { id: company1.id }).length.should.eql(1);
		});

		it('should return a collection with the second company', function() {
			_.where(body, { id: company2.id }).length.should.eql(1);
		});

		it('should not return companies from another tenant', function() {
			_.where(body, { id: company3.id }).length.should.eql(0);
		});
	});


	/**
	 * Create
	 */
	describe('When a company is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/companies')
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating a company', function() {

		var response;
		var body;
		var company;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/companies')
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'John BVBA' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Company.findById(body.id, function(err, c){
						company = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			company.should.exist;
		});

		it('should create a company with the specified name', function(){
			company.name.should.eql('John BVBA');
		});

		it('should create a company for the logged in user', function(){
			company.tenant.should.eql(testdata.normalAccountId);
		});
		
		it('should return the id of the company', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('John BVBA');
		});				
	});	 

	/**
	 * Update
	 */
	describe('When a company is updated by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/companies/' + uuid.v1())
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating a company', function() {

		var response;
		var body;
		var company;

		before(function(done) {

			company = Company.create(testdata.normalAccountId, 'John BVBA');

			async.series([
				function(done){
					company.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/companies/' + company.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Jane BVBA' })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Company.findById(body.id, function(err, c){
								company = c;
								done();
							});
						});
				}
			], done);
		});

		it('should be saved in the database', function() {
			company.should.exist;
		});

		it('should update the company with the specified name', function(){
			company.name.should.eql('Jane BVBA');
		});
		
		it('should return the id of the company', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('Jane BVBA');
		});				
	});	 

	describe('When updating a company from another tenant', function() {

		var response;
		var body;
		var company;

		before(function(done) {

			company = Company.create(uuid.v1(), 'John BVBA');

			async.series([
				function(done){
					company.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/companies/' + company.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Jane BVBA' })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);
		});

		it('should not be updated', function(done) {
			Company.findById(company.id, function(err, c){
				if(err){ done(err); }

				c.name.should.eql('John BVBA');
				done();
			});
		});		
	});	 
});