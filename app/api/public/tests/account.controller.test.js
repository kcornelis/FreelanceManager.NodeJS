'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	_ = require('lodash'),
	async = require('async'),
	request = require('supertest'),
	controller = require('../controllers/account'),
	config = require_config(),
	uuid = require('node-uuid'),
	Account = require('mongoose').model('Account'),
	testdata = require_infrastructure('testdata');


describe('Public API: Account Controller Integration Tests:', function() {

	/**
	 * Get by id
	 */
	describe('When an account is requested by id by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/accounts/' + uuid.v1())
				.expect(401)
				.end(done);
		});
	});

	describe('When an account is requested by id', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			account = Account.create('John BVBA', 'John', 'Doe', 'john_001@doe.com');
			
			async.series([
				function(done) {

					account.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.get('/api/public/accounts/' + account._id)
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
			body.id.should.eql(account.id);
		});

		it('should create an account with the specified name', function() {

			body.name.should.eql('John BVBA');
		});

		it('should create an account with the specified first name', function() {

			body.firstName.should.eql('John');
		});

		it('should create an account with the specified last name', function() {

			body.lastName.should.eql('Doe');
		});	

		it('should create an account with the specified email', function() {

			body.email.should.eql('john_001@doe.com');
		});					
	});

	/**
	 * Get all accounts
	 */
	describe('When all accounts are requested by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.get('/api/public/accounts')
				.expect(401)
				.end(done);
		});
	});

	describe('When an all accounts are requested', function() {

		var response;
		var body;

		var account1;
		var account2;

		before(function(done) {

			account1 = Account.create('John BVBA', 'John', 'Doe', 'john_002@doe.com');
			account2 = Account.create('John BVBA', 'John', 'Doe', 'john_003@doe.com');
			
			async.series([
				function(done) {

					account1.save(done);
				},
				function(done) {

					account2.save(done);
				},
				function(done) {

					
					request('http://localhost:' + config.port)
						.get('/api/public/accounts')
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
			_.where(body, { id: account1.id }).length.should.eql(1);
		});

		it('should return a collection with the second account', function() {
			_.where(body, { id: account2.id }).length.should.eql(1);
		});

		it('should not contain an unexisting id', function() {
			_.where(body, { id: uuid.v1() }).length.should.eql(0);
		});
	});

	/**
	 * Create
	 */
	describe('When an account is created by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts')
				.send({ name: 'John BVBA', firstName: 'John', lastName: 'Doe', email: 'john_004@doe.com' })
				.expect(401)
				.end(done);
		});
	});

	describe('When creating an account', function() {

		var response;
		var body;
		var account;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/public/accounts')
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'John BVBA', firstName: 'John', lastName: 'Doe', email: 'john_005@doe.com' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					Account.findById(body.id, function(err, a) {

						account = a;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			account.should.exist;
		});

		it('should create an account with the specified name', function() {

			account.name.should.eql('John BVBA');
		});

		it('should create an account with the specified first name', function() {

			account.firstName.should.eql('John');
		});

		it('should create an account with the specified last name', function() {

			account.lastName.should.eql('Doe');
		});	

		it('should create an account with the specified email', function() {

			account.email.should.eql('john_005@doe.com');
		});	
		
		it('should return the id of the account', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should return the name', function() {

			body.name.should.eql('John BVBA');
		});

		it('should return the first name', function() {

			body.firstName.should.eql('John');
		});

		it('should return the last name', function() {

			body.lastName.should.eql('Doe');
		});	

		it('should return the email', function() {

			body.email.should.eql('john_005@doe.com');
		});					
	});	 

	/**
	 * Update
	 */
	describe('When a account is updated by an unauthenticated person', function() {

		it('should return a 401 satus code', function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + uuid.v1())
				.send({ name: 'John BVBA' })
				.expect(401)
				.end(done);
		});
	});

	describe('When updating an account', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + testdata.normalAccountId)
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'Jane BVBA', firstName: 'Jane', lastName: 'D', email: '123456789jane@doe.com' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {

					if(err)
						throw err;

					response = res;
					body = res.body;

					Account.findById(body.id, function(err, c) {

						account = c;
						done();
					});
				});
		});

		it('should be saved in the database', function() {
			account.should.exist;
		});

		it('should update the account with the specified name', function() {

			account.name.should.eql('Jane BVBA');
		});

		it('should update the account with the specified first name', function() {

			account.firstName.should.eql('Jane');
		});

		it('should update the account with the specified last name', function() {

			account.lastName.should.eql('D');
		});		

		it('should update the account with the specified email', function() {

			account.email.should.eql('123456789jane@doe.com');
		});				
		
		it('should return the id of the account', function() {
			body.id.should.match(account.id);
		});

		it('should return the name', function() {

			body.name.should.eql('Jane BVBA');
		});	

		it('should return the first name', function() {

			body.firstName.should.eql('Jane');
		});	

		it('should return the last name', function() {

			body.lastName.should.eql('D');
		});	

		it('should return the email', function() {

			body.email.should.eql('123456789jane@doe.com');
		});	

		after(function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + testdata.normalAccountId)
				.set('Authorization', testdata.normalAccountToken)
				.send({ name: 'John BVBA', firstName: 'John', lastName: 'Doe', email: '123456789john@doe.com' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(done);
		});								
	});	 

	describe('When updating a account from another tenant', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			account = Account.create('Jane BVBA', 'Jane', 'Doe', 'jane67890@doe.com');
			account.changePassword('12345');

			async.series([
				function(done) {

					account.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/accounts/' + account.id)
						.set('Authorization', testdata.normalAccountToken)
						.send({ name: 'John BVBA', firstName: 'John', lastName: 'Doe', email: '12345john@doe.com' })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);


		});

		it('should not be updated', function(done) {
			Account.findById(account.id, function(err, c) {

				if(err) {
 done(err); }

				c.name.should.eql('Jane BVBA');
				done();
			});
		});		
	});

	describe('When changing an account password', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + testdata.normalAccountId + '/changepassword')
				.set('Authorization', testdata.normalAccountToken)
				.send({ oldPassword: '12345', newPassword: '67890' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {

					if(err)
						throw err;

					response = res;
					body = res.body;

					Account.findById(testdata.normalAccountId, function(err, c) {

						account = c;
						done();
					});
				});		

		});

		it('should update the account password with the specified new password', function() {

			account.authenticate('67890').should.be.true;
		});

		it('should return ok', function() {

			body.ok.should.be.true;
		});

		after(function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + testdata.normalAccountId + '/changepassword')
				.set('Authorization', testdata.normalAccountToken)
				.send({ oldPassword: '67890', newPassword: '12345' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(done);
		});								
	});	

	describe('When changing an account password with the wrong old password', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			request('http://localhost:' + config.port)
				.post('/api/public/accounts/' + testdata.normalAccountId + '/changepassword')
				.set('Authorization', testdata.normalAccountToken)
				.send({ oldPassword: 'wrong', newPassword: '67890' })
				.expect('Content-Type', /html/)
				.expect(404)
				.end(function(err, res) {

					if(err)
						throw err;

					response = res;
					body = res.body;

					Account.findById(testdata.normalAccountId, function(err, c) {

						account = c;
						done();
					});
				});					

		});

		it('should not update the account password with the specified new password', function() {

			account.authenticate('12345').should.be.true;
		});							
	});	 	 

	describe('When updating an account password from another tenant', function() {

		var response;
		var body;
		var account;

		before(function(done) {

			account = Account.create('Jane BVBA', 'Jane', 'Doe', 'jane1234567@doe.com');
			account.changePassword('12345');

			async.series([
				function(done) {

					account.save(done);
				},
				function(done) {


					request('http://localhost:' + config.port)
						.post('/api/public/accounts/' + account.id + '/changepassword')
						.set('Authorization', testdata.normalAccountToken)
						.send({ oldPassword: '12345', newPassword: '5678' })
						.expect('Content-Type', /html/)
						.expect(404)
						.end(done);
				}
			], done);


		});

		it('should not be updated', function(done) {
			Account.findById(account.id, function(err, c) {

				if(err) {
 done(err); }

				account.authenticate('12345').should.be.true;

				done();
			});
		});		
	});	
});