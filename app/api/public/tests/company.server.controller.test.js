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
				.get('/api/public/company/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a company is requested by id', function() {


		var response;
		var body;
		var company;

		before(function(done){
			company = Company.create('John BVBA');
			
			async.series([
				function(done){
					company.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.get('/api/public/company/' + company.id)
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

		before(function(done){
			company1 = Company.create('John BVBA');
			company2 = Company.create('John BVBA');
			
			async.series([
				function(done){
					company1.save(done);
				},
				function(done){
					company2.save(done);
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
			_.where(body, { id: company1.id }).should.exist;
		});

		it('should return a collection with the second company', function() {
			_.where(body, { id: company2.id }).should.exist;
		});

		it('should not contain a unexisting id', function() {
			_.where(body, { id: uuid.v1() }).should.not.exist;
		});
	});

	/**
	 * Create
	 */
	describe('When a company is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/company/create')
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
				.post('/api/public/company/create')
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
				.post('/api/public/company/update/' + uuid.v1())
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

			company = Company.create('John BVBA');

			async.series([
				function(done){
					company.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/company/update/' + company.id)
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
});