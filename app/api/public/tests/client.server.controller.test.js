'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/client'),
	config = require_config(),
	uuid = require('node-uuid'),
	Client = require('mongoose').model('Client'),
	testdata = require_infrastructure('testdata');


describe('Public API: Client Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When an client is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/client/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When an client is requested by id', function() {

		var response;
		var body;
		var client;

		before(function(done){
			client = Client.create('John BVBA');
			
			async.series([
				function(done){
					client.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.get('/api/public/client/' + client.id)
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
		
		it('should return the id of the client', function() {
			body.id.should.eql(client.id);
		});

		it('should create an client with the specified name', function(){
			body.name.should.eql('John BVBA');
		});				
	});

	/**
	 * Get all clients
	 */
	describe('When all clients are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/public/clients')
				.expect(401)
				.end(done);
		});
	});

	describe('When an all clients are requested', function() {

		var response;
		var body;

		var client1;
		var client2;

		before(function(done){
			client1 = Client.create('John BVBA');
			client2 = Client.create('John BVBA');
			
			async.series([
				function(done){
					client1.save(done);
				},
				function(done){
					client2.save(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/public/clients')
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
		
		it('should return a collection with the first client', function() {
			_.where(body, { id: client1.id }).should.exist;
		});

		it('should return a collection with the second client', function() {
			_.where(body, { id: client2.id }).should.exist;
		});

		it('should not contain an unexisting id', function() {
			_.where(body, { id: uuid.v1() }).should.not.exist;
		});
	});

	/**
	 * Create
	 */
	describe('When an client is created by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/client/create')
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating an client', function() {

		var response;
		var body;
		var client;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/client/create')
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'John BVBA' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Client.findById(body.id, function(err, c){
						client = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			client.should.exist;
		});

		it('should create an client with the specified name', function(){
			client.name.should.eql('John BVBA');
		});
		
		it('should return the id of the client', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('John BVBA');
		});				
	});	 

	/**
	 * Create
	 */
	describe('When an client is updated by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.post('/api/public/client/update/' + uuid.v1())
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating an client', function() {

		var response;
		var body;
		var client;

		before(function(done) {

			client = Client.create('John BVBA');

			async.series([
				function(done){
					client.save(done);
				},
				function(done){

					request('http://localhost:' + config.port)
						.post('/api/public/client/update/' + client.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'Jane BVBA' })
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if(err)
								throw err;

							response = res;
							body = res.body;

							Client.findById(body.id, function(err, c){
								client = c;
								done();
							});
						});
				}
			], done);
		});

		it('should be saved in the database', function() {
			client.should.exist;
		});

		it('should create an client with the specified name', function(){
			client.name.should.eql('Jane BVBA');
		});
		
		it('should return the id of the client', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function(){
			body.name.should.eql('Jane BVBA');
		});				
	});	 
});