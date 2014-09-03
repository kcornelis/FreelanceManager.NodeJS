'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	request = require('supertest'),
	controller = require('../controllers/account'),
	config = require_config(),
	Account = require_domain('account'),
	repository = require_infrastructure('repository');

/**
 * Unit tests
 */
describe('API-Write: Account Controller Integration Tests:', function() {

	describe('When creating an account', function() {

		var response;
		var body;
		var account;

		before(function(done) {
			
			request('http://localhost:' + config.port)
				.post('/api/write/accounts/create')
				.send({ name: 'John BVBA', firstName: 'John', lastName: 'Doe', email: 'john@doe.com' })
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err, res) {
					if(err)
						throw err;

					response = res;
					body = res.body;

					repository.getById(new Account(body.id), function(err, a){
						account = a;
						done();
					});
				});
		});
		
		it('should return the id of the account', function() {
			body.id.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
			body.id.should.eql(account.getId());
		});

		it('should create an account with the specified name', function(){
			account.getName().should.eql('John BVBA');
		});

		it('should create an account with the specified first name', function(){
			account.getFirstName().should.eql('John');
		});

		it('should create an account with the specified last name', function(){
			account.getLastName().should.eql('Doe');
		});	

		it('should create an account with the specified email', function(){
			account.getEmail().should.eql('john@doe.com');
		});					
	});
});
