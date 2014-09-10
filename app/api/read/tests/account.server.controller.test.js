'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	uuid = require('node-uuid'),
	request = require('supertest'),
	controller = require('../controllers/account'),
	config = require_config(),
	DomainAccount = require_domain('account'),
	servicebus = require_infrastructure('servicebus'),
	testdata = require_infrastructure('testdata');

/**
 * Unit tests
 */
describe('API-Read: Account Controller Integration Tests:', function() {

	describe('When an account is requested by id by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/read/account/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When an account is requested by id', function() {

		var id = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainAccount.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/read/account/' + id)
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
		
		it('should return the id of the account', function() {
			body.aggregateRootId.should.eql(id);
		});

		it('should create an account with the specified name', function(){
			body.name.should.eql('John BVBA');
		});

		it('should create an account with the specified first name', function(){
			body.firstName.should.eql('John');
		});

		it('should create an account with the specified last name', function(){
			body.lastName.should.eql('Doe');
		});	

		it('should create an account with the specified email', function(){
			body.email.should.eql('john@doe.com');
		});					
	});

	describe('When all accounts are requested by an unauthenticated person', function(){
		it('should return a 401 satus code', function(done){
			request('http://localhost:' + config.port)
				.get('/api/read/accounts')
				.expect(401)
				.end(done);
		});
	});

	describe('When an all accounts are requested', function() {

		var id1 = uuid.v1();
		var id2 = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainAccount1 = new DomainAccount(id1, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			var domainAccount2 = new DomainAccount(id2, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainAccount1.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.publishDomainEvents(
						domainAccount2.getUncommittedChanges(), done);
				},				
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					
					request('http://localhost:' + config.port)
						.get('/api/read/accounts')
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
		
		it('should return a collection with the first account', function() {
			_.where(body, { aggregateRootId: id1 }).should.exist;
		});

		it('should return a collection with the second account', function() {
			_.where(body, { aggregateRootId: id2 }).should.exist;
		});

		it('should not contain an unexisting id', function() {
			_.where(body, { aggregateRootId: uuid.v1 }).should.not.exist;
		});
	});
});