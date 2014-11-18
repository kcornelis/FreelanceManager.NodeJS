'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account');


describe('Account Model Unit Tests:', function() {

	describe('When an account is created', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
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
				email: 'john@doe.com'
			}, function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have a first name', function(){
			saved.firstName.should.eql('John');
		});

		it('should have a last name', function(){
			saved.lastName.should.eql('Doe');
		});

		it('should have a name', function(){
			saved.name.should.eql('John Doe');
		});

		it('should have a email', function(){
			saved.email.should.eql('john@doe.com');
		});

		it('should not be admin by default', function(){
			saved.admin.should.eql(false);
		});

		it('should have version 1', function(){
			saved.version.should.eql(1);
		});

		it('should have a created event', function(){
			saved.events[0].name.should.eql('John Doe');
			saved.events[0].firstName.should.eql('John');
			saved.events[0].lastName.should.eql('Doe');
			saved.events[0].email.should.eql('john@doe.com');

			saved.events[0].metadata.eventName.should.eql('AccountCreated');
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

	describe('When an account is created with no name', function() {

		it('should fail', function(done) {

			var account = Account.create(null, 'John', 'Doe', 'john@doe.com');
			account.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When an account is created with no email', function() {

		it('should fail', function(done) {

			var account = Account.create('John Doe BVBA', 'John', 'Doe', '');
			account.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('An account', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe BVBA', 'John', 'Doe', 'john@doe.com');
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
				email: 'john@doe.com'
			}, function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have a full name', function(){
			saved.fullName.should.eql('John Doe');
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

	describe('An account with the same email', function() {

		var account1, account2;

		before(function(done) {
			account1 = Account.create('John Doe BVBA', 'John', 'Doe', 'john@doe.com');
			account2 = Account.create('John', 'J', 'D', 'john@doe.com');
			done();
		});

		it('should be able to save without problems', function(done) {
			account1.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should not be saved in the database', function(done) {
			account2.save(function(err) {
				should.exist(err);
				done();
			});
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});	

	describe('When an accounts details are changed', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Account.findOne({
				email: 'john@doe.com'
			}, function(finderr, account) {

				should.not.exist(finderr);

				account.changeDetails('John Doe 1', 'John 1', 'Doe 1', 'john1@doe.com')

				account.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Account.findOne({
				email: 'john1@doe.com'
			}, function(err, account) {

				should.not.exist(err);
				should.exist(account);

				saved = account;

				done();
			});
		});

		it('should have an updated first name', function(){
			saved.firstName.should.eql('John 1');
		});

		it('should have an updated last name', function(){
			saved.lastName.should.eql('Doe 1');
		});

		it('should have an updated name', function(){
			saved.name.should.eql('John Doe 1');
		});

		it('should have an updated email', function(){
			saved.email.should.eql('john1@doe.com');
		});

		it('should have no updated admin field', function(){
			saved.admin.should.eql(false);
		});

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function(){
			saved.version.should.eql(2);
		});

		it('should have a details changed event', function(){
			saved.events[1].name.should.eql('John Doe 1');
			saved.events[1].firstName.should.eql('John 1');
			saved.events[1].lastName.should.eql('Doe 1');
			saved.events[1].email.should.eql('john1@doe.com');

			saved.events[1].metadata.eventName.should.eql('AccountDetailsChanged');
		});

		after(function(done) {
			Account.remove({ email: 'john1@doe.com'}, done);
		});
	});

	describe('When a account details is changed with the same values', function() {

		var account;

		before(function() {
			account = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			account.changeDetails('John Doe', 'John', 'Doe', 'john@doe.com');
		});

		it('should not create a new event', function(){
			account.events.should.have.length(1);
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

	describe('When an accounts password is changed', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			original.changePassword('hello');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Account.findOne({
				email: 'john@doe.com'
			}, function(err, account) {

				should.not.exist(err);

				saved = account;

				done();
			});
		});

		it('should have the new password', function(){
			saved.authenticate('hello').should.eql(true);
		});

		it('should have a password changed event', function(){
			saved.events[1].passwordHash.should.exist;
			saved.events[1].passwordSalt.should.exist;

			saved.events[1].metadata.eventName.should.eql('AccountPasswordChanged');
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});


	describe('When an account is made admin', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			original.makeAdmin();
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Account.findOne({
				email: 'john@doe.com'
			}, function(err, account) {

				should.not.exist(err);

				saved = account;

				done();
			});
		});

		it('should be admin', function(){
			saved.admin.should.eql(true);
		});

		it('should have a made admin event', function(){
			saved.events[1].metadata.eventName.should.eql('AccountMadeAdmin');
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

	describe('When an account is made admin for the second time', function() {

		var account;

		before(function() {
			account = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			account.makeAdmin();
			account.makeAdmin();
		});

		it('should not create a new event', function(){
			account.events.should.have.length(2);
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

	describe('When an account is authenticated', function() {

		var original, saved;

		before(function(done) {
			original = Account.create('John Doe', 'John', 'Doe', 'john@doe.com');
			original.changePassword('hello');
			original.save(function(){
				Account.findOne({
					email: 'john@doe.com'
				}, function(err, account) {
					saved = account;
					done();
				});
			});
		});

		it('should succeed with the correct password', function(){
			saved.authenticate('hello').should.eql(true);
		});

		it('should fail with the wrong password', function(){
			saved.authenticate('hello1').should.eql(false);
		});

		it('should fail with an emtpy password', function(){
			saved.authenticate('').should.eql(false);
		});

		after(function(done) {
			Account.remove({ email: 'john@doe.com'}, done);
		});
	});

});