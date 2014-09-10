'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	async = require('async'),
	mongoose = require('mongoose'),
	DomainAccount = require_domain('account'),
	Account = mongoose.model('Account'),
	servicebus = require_infrastructure('servicebus');


/**
 * Unit tests
 */
describe('Account Handlers Unit Tests:', function() {

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

		it('should create an account', function(done){
			Account.findOne({
				aggregateRootId: id
			}, function(err, a) {

				should.not.exist(err);
				should.exist(a);
				account = a;

				done();
			});
		});	

		it('should create an account with a aggregate root id', function(){
			account.aggregateRootId.should.eql(id);
		});

		it('should create an account with a name', function(){
			account.name.should.eql('John BVBA');
		});

		it('should create an account with a first name', function(){
			account.firstName.should.eql('John');
		});

		it('should create an account with a last name', function(){
			account.lastName.should.eql('Doe');
		});

		it('should create an account with a email', function(){
			account.email.should.eql('john@doe.com');
		});

		it('should not be admin', function(){
			account.admin.should.eql(false);
		});

		it('should create an account with a version', function(){
			account.version.should.eql(1);
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
					Account.findOne({
						aggregateRootId: id
					}, function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should have the correct aggregate root id', function(){
			account.aggregateRootId.should.eql(id);
		});

		it('should update the account with the new name', function(){
			account.name.should.eql('Jane BVBA');
		});

		it('should update the account with the new first name', function(){
			account.firstName.should.eql('Jane');
		});

		it('should update the account with the new last name', function(){
			account.lastName.should.eql('Test');
		});

		it('should update the account with the new email', function(){
			account.email.should.eql('jane@test.com');
		});

		it('should update an account with the new version', function(){
			account.version.should.eql(2);
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
					Account.findOne({
						aggregateRootId: id
					}, function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should should be admin', function(){
			account.admin.should.eql(true);
		});

		it('should update the account with the new version', function(){
			account.version.should.eql(2);
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
					Account.findOne({
						aggregateRootId: id
					}, function(err, a) {
						account = a;
						done();
					});
				}
			], done);
		});

		it('should update the account with the new version', function(){
			account.version.should.eql(2);
		});
	});
});
