/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	_ = require('lodash'),
	util = require('util'),
	Account = require('../account');

/**
 * Unit tests
 */
describe('Account Domain Model Unit Tests:', function() {

	describe('When an account is created', function() {

		var id = uuid.v1();
		var account = new Account(id, 'John BVBA', 'John', 'Doe', 'john@test.com');

		it('should have an id', function() {
			account.getId().should.eql(id);
		});

		it('should have a name', function(){
			account.getName().should.eql('John BVBA');
		});

		it('should have a first name', function(){
			account.getFirstName().should.eql('John');
		});

		it('should have a last name', function(){
			account.getLastName().should.eql('Doe');
		});

		it('should have a full name', function(){
			account.getFullName().should.eql('John Doe');
		});

		it('should have an email', function(){
			account.getEmail().should.eql('john@test.com');
		});

		it('should not be admin', function(){
			account.getIsAdmin().should.eql(false);
		});
	});

	describe('When an account is made admin', function(){

		var id = uuid.v1();
		var account = new Account(id, 'John BVBA', 'John', 'Doe', 'john@test.com');
		account.makeAdmin();

		it('should be admin', function(){
			account.getIsAdmin().should.eql(true);			
		});	
	});

	describe('When an account password is changed', function(){

		var id = uuid.v1();
		var account = new Account(id, 'John BVBA', 'John', 'Doe', 'john@test.com');
		account.changePassword('mysecret');

		it('should be able to authenticate with the new password', function(){
			account.verifyPassword('mysecret').should.be.ok;
		});

		it('should not be able to authenticate with a different password', function(){
			account.verifyPassword('abc').should.not.be.ok;
		});

		it('should not be able to authenticate with an empty password', function(){
			account.verifyPassword('').should.not.be.ok;
		});
	});

	describe('When an account details are changed', function() {

		var id = uuid.v1();
		var account = new Account(id, 'John BVBA', 'John', 'Doe', 'john@test.com');
		account.changeDetails('Jane BVBA', 'Jane', 'Test', 'jane@test.com');

		it('should have a new name', function(){
			account.getName().should.eql('Jane BVBA');
		});

		it('should have a new first name', function(){
			account.getFirstName().should.eql('Jane');
		});

		it('should have a new last name', function(){
			account.getLastName().should.eql('Test');
		});

		it('should have a new full name', function(){
			account.getFullName().should.eql('Jane Test');
		});

		it('should have an new email', function(){
			account.getEmail().should.eql('jane@test.com');
		});
	});	
});