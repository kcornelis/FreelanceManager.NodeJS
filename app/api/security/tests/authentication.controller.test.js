'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/authentication'),
	Account = require('mongoose').model('Account'),
	config = require_config();

/**
 * Unit tests
 */
describe('Security: Authentication Controller Integration Tests:', function() {

	describe('When an account is authentication', function() {

		var response;
		var body;

		before(function(done) {

			var account = Account.create('John BVBA', 'John', 'Doe', 'john123456@doe.com');
			account.changePassword('123');
			
			async.series([
				function(done) {
					account.save(done);
				},
				function(done) {

					request('http://localhost:' + config.port)
						.post('/security/authenticate')
						.send({ email: 'john123456@doe.com', password: '123' })
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

		var response;
		var body;

		before(function(done) {

			var account = Account.create('John BVBA', 'John', 'Doe', 'john567890@doe.com');
			account.changePassword('567');
			
			async.series([
				function(done) {
					account.save(done);
				},
				function(done) {

					request('http://localhost:' + config.port)
						.post('/security/authenticate')
						.send({ email: 'john567890@doe.com', password: '123' })
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
