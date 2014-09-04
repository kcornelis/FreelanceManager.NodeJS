'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	crypto = require('crypto'),
	AccountPassword = mongoose.model('AccountPassword');


/**
 * Unit tests
 */
describe('Account Password Model Unit Tests:', function() {

	describe('When an account password is created', function() {

		var original, saved;
		var salt = crypto.randomBytes(16).toString('base64');
		var hash = crypto.pbkdf2Sync('pas123', new Buffer(salt, 'base64'), 10000, 64).toString('base64');

		before(function(done) {
			original = new AccountPassword({
				aggregateRootId: 'my unique id',
				passwordHash: hash,
				passwordSalt: salt,
				email: 'test@test.com',
				version: 2
			});
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			AccountPassword.findOne({
				email: 'test@test.com'
			}, function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have a aggregate root id', function(){
			saved.aggregateRootId.should.eql('my unique id');
		});

		it('should have a password hash', function(){
			saved.passwordHash.should.eql(hash);
		});

		it('should have a password salt', function(){
			saved.passwordSalt.should.eql(salt);
		});

		it('should have a email', function(){
			saved.email.should.eql('test@test.com');
		});

		it('should have a version', function(){
			saved.version.should.eql(2);
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		if('should authenticate with the correct password', function(){
			saved.authenticate('pas123').should.be.ok;
		});

		if('should not authenticate with the wrong password', function(){
			saved.authenticate('123').should.not.be.ok;
		});

		if('should not authenticate with an empty password', function(){
			saved.authenticate('').should.not.be.ok;
		});

		after(function(done) {
			AccountPassword.remove().exec();
			done();
		});
	});


	describe('When an account password is modified', function() {

		var original, saved;

		before(function(done) {
			original = new AccountPassword({
				aggregateRootId: 'my unique id',
				passwordHash: 'hash',
				passwordSalt: 'salt',
				email: 'test@test.com',
				version: 2
			});
			
			original.save(function(err) {
				done();
			});
		});

		it('should be saved with no problems', function(done) {
			AccountPassword.findOne({
				email: 'test@test.com'
			})
			.exec(function(finderr, account) {

				should.not.exist(finderr);

				account.passwordHash = 'hash 1';
				account.passwordSalt = 'salt 1';
				account.email = 'test1@test.com';
				account.version = 3;

				account.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			AccountPassword.findOne({
				email: 'test1@test.com'
			})
			.exec(function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have an updated password hash', function(){
			saved.passwordHash.should.eql('hash 1');
		});

		it('should have an updated password salt', function(){
			saved.passwordSalt.should.eql('salt 1');
		});

		it('should have an updated email', function(){
			saved.email.should.eql('test1@test.com');
		});

		it('should have an updated version', function(){
			saved.version.should.eql(3);
		});

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		after(function(done) {
			AccountPassword.remove().exec();
			done();
		});
	});
});