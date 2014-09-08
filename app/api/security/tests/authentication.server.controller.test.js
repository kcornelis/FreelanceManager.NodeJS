'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	uuid = require('node-uuid'),
	request = require('supertest'),
	controller = require('../controllers/authentication'),
	config = require_config(),
	DomainAccount = require_domain('account'),
	servicebus = require_infrastructure('servicebus');

/**
 * Unit tests
 */
describe('Security: Authentication Controller Integration Tests:', function() {

	describe('When an account is authentication', function() {

		var id = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john123@doe.com');
			domainAccount.changePassword('123');
			
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
						.post('/security/authenticate')
						.send({ email: 'john123@doe.com', password: '123' })
						.expect('Content-Type', /json/)
						.expect(200)
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
		
		it('should have a token', function() {
			body.token.should.exist;
		});	

		it('should not have an empty token', function() {
			body.token.length.should.be.greaterThan(10);
		});				
	});

	describe('When an account is authentication with the wrong password', function() {

		var id = uuid.v1();
		var response;
		var body;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john567@doe.com');
			domainAccount.changePassword('567');
			
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
						.post('/security/authenticate')
						.send({ email: 'john567@doe.com', password: '123' })
						.expect(401)
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
		
		it('should not return a token', function() {
			(body.token === undefined).should.be.true;
		});				
	});
});