'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	uuid = require('node-uuid'),
	request = require('supertest'),
	controller = require('../controllers/client'),
	config = require_config(),
	DomainClient = require_domain('client'),
	servicebus = require_infrastructure('servicebus'),
	testdata = require_infrastructure('testdata');

/**
 * Unit tests
 */
describe('API-Read: Client Controller Integration Tests:', function() {

	describe('When a client is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/read/client/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When a client is requested by id', function() {

		var id = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainClient = new DomainClient(id, 'John Doe');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainClient.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/read/client/' + id)
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
			body.aggregateRootId.should.eql(id);
		});

		it('should create a client with the specified name', function(){
			body.name.should.eql('John Doe');
		});				
	});

	describe('When all clients are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/read/clients')
				.expect(401)
				.end(done);
		});
	});

	describe('When an all clients are requested', function() {

		var id1 = uuid.v1();
		var id2 = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainClient1 = new DomainClient(id1, 'John Doe 1');
			var domainClient2 = new DomainClient(id2, 'John Doe 2');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainClient1.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.publishDomainEvents(
						domainClient2.getUncommittedChanges(), done);
				},				
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/read/clients')
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
			_.where(body, { aggregateRootId: id1 }).should.exist;
		});

		it('should return a collection with the second client', function() {
			_.where(body, { aggregateRootId: id2 }).should.exist;
		});

		it('should not contain an unexisting id', function() {
			_.where(body, { aggregateRootId: uuid.v1 }).should.not.exist;
		});
	});
});