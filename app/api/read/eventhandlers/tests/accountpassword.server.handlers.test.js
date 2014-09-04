'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	async = require('async'),
	mongoose = require('mongoose'),
	DomainAccount = require_domain('account'),
	AccountPassword = mongoose.model('AccountPassword'),
	servicebus = require_infrastructure('servicebus');


/**
 * Unit tests
 */
describe('Account Password Handlers Unit Tests:', function() {

	describe('When an account created event is received', function() {

		var id = uuid.v1();
		var account;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainAccount.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				}
			], done);
		});

		it('should create an account password', function(done){
			AccountPassword.findOne({
				aggregateRootId: id
			})
			.exec(function(err, a) {

				should.not.exist(err);
				should.exist(a);
				account = a;

				done();
			});
		});	

		it('should create an account with a aggregate root id', function(){
			account.aggregateRootId.should.eql(id);
		});

		it('should create an account with no password hash', function(){
			account.passwordHash.should.be.empty;
		});

		it('should create an account with no password salt', function(){
			account.passwordSalt.should.be.empty
		});

		it('should create an account with a email', function(){
			account.email.should.eql('john@doe.com');
		});

		it('should create an account with a version', function(){
			account.version.should.eql(1);
		});

		after(function(done) {
			AccountPassword.remove().exec(function(){
				done();
			});
		});	
	});

	describe('When an account details changed event is received', function() {

		var id = uuid.v1();
		var account;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			domainAccount.changeDetails('Jane BVBA', 'Jane', 'Test', 'jane@test.com');

			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainAccount.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					AccountPassword.findOne({
						aggregateRootId: id
					})
					.exec(function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should have the correct aggregate root id', function(){
			account.aggregateRootId.should.eql(id);
		});

		it('should update the account password with the new email', function(){
			account.email.should.eql('jane@test.com');
		});

		it('should update an account password with the new version', function(){
			account.version.should.eql(2);
		});

		after(function(done) {
			AccountPassword.remove().exec(function(){
				done();
			});
		});	
	});

	describe('When an account is made admin', function() {

		var id = uuid.v1();
		var account;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john@doe.com');
			domainAccount.makeAdmin();

			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainAccount.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					AccountPassword.findOne({
						aggregateRootId: id
					})
					.exec(function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should update the account password with the new version', function(){
			account.version.should.eql(2);
		});

		after(function(done) {
			AccountPassword.remove().exec(function(){
				done();
			});
		});	
	});

	describe('When an account password is changed', function() {

		var id = uuid.v1();
		var account;

		before(function(done){
			var domainAccount = new DomainAccount(id, 'John BVBA', 'John', 'Doe', 'john@doe.com');
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
					AccountPassword.findOne({
						aggregateRootId: id
					})
					.exec(function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should update the account password with the password hash', function(){
			account.authenticate('123').should.be.ok;
		});

		it('should update the account with the new version', function(){
			account.version.should.eql(2);
		});

		after(function(done) {
			AccountPassword.remove().exec(function(){
				done();
			});
		});	
	});
});
