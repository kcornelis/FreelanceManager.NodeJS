'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account');


/**
 * Unit tests
 */
describe('Account Model Unit Tests:', function() {

	describe('When an account is created', function() {

		var original, saved;

		before(function(done) {
			original = new Account({
				aggregateRootId: 'my unique id',
				firstName: 'Full',
				lastName: 'Name',
				name: 'Full Name',
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
			Account.findOne({
				email: 'test@test.com'
			})
			.exec(function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have a aggregate root id', function(){
			saved.aggregateRootId.should.eql('my unique id');
		});

		it('should have a first name', function(){
			saved.firstName.should.eql('Full');
		});

		it('should have a last name', function(){
			saved.lastName.should.eql('Name');
		});

		it('should have a name', function(){
			saved.name.should.eql('Full Name');
		});

		it('should have a email', function(){
			saved.email.should.eql('test@test.com');
		});

		it('should not be admin by default', function(){
			saved.admin.should.eql(false);
		});

		it('should have a version', function(){
			saved.version.should.eql(2);
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Account.remove().exec();
			done();
		});
	});


	describe('When an account is modified', function() {

		var original, saved;

		before(function(done) {
			original = new Account({
				firstName: 'Full',
				lastName: 'Name',
				name: 'Full Name',
				email: 'test@test.com',
				version: 2
			});
			
			original.save(function(err) {
				done();
			});
		});

		it('should be saved with no problems', function(done) {
			Account.findOne({
				email: 'test@test.com'
			})
			.exec(function(finderr, account) {

				should.not.exist(finderr);

				account.firstName = 'Full 1';
				account.lastName = 'Name 1';
				account.name = 'Full Name 1';
				account.email = 'test1@test.com';
				account.admin = true;
				account.version = 3;

				account.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Account.findOne({
				email: 'test1@test.com'
			})
			.exec(function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have an updated first name', function(){
			saved.firstName.should.eql('Full 1');
		});

		it('should have an updated last name', function(){
			saved.lastName.should.eql('Name 1');
		});

		it('should have an updated name', function(){
			saved.name.should.eql('Full Name 1');
		});

		it('should have an updated email', function(){
			saved.email.should.eql('test1@test.com');
		});

		it('should have an updated admin field', function(){
			saved.admin.should.eql(true);
		});

		it('should have an updated version', function(){
			saved.version.should.eql(3);
		});

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		after(function(done) {
			Account.remove().exec();
			done();
		});
	});

});