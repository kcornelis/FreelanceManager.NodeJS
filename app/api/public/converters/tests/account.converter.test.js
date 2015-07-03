'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account'),
	convert = require('../account');

describe('Account Converter Unit Tests:', function() {

	describe('When an account is converted to a dto', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto(Account.create('John Doe', 'John', 'Doe', 'john@doe.com'));
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a first name', function() {
			converted.firstName.should.eql('John');
		});

		it('should have a last name', function() {
			converted.lastName.should.eql('Doe');
		});

		it('should have a name', function() {
			converted.name.should.eql('John Doe');
		});

		it('should have a email', function() {
			converted.email.should.eql('john@doe.com');
		});
	});

	describe('When multiple accounts are converted to dtos', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto([
				Account.create('John Doe', 'John', 'Doe', 'john@doe.com'),
				Account.create('Jane Doe', 'Jane', 'Doe', 'jane@doe.com')
			]);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].firstName.should.eql('John');
			converted[1].firstName.should.eql('Jane');

			converted[0].email.should.eql('john@doe.com');
			converted[1].email.should.eql('jane@doe.com');
		});
	});

	describe('When an account is converted to a dto with a promise', function() {

		var converted;

		beforeEach(function(done) {

			convert.toDtoQ(Account.create('John Doe', 'John', 'Doe', 'john@doe.com'))
				.done(function(a) { converted = a; done(); });
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a first name', function() {
			converted.firstName.should.eql('John');
		});

		it('should have a last name', function() {
			converted.lastName.should.eql('Doe');
		});

		it('should have a name', function() {
			converted.name.should.eql('John Doe');
		});

		it('should have a email', function() {
			converted.email.should.eql('john@doe.com');
		});
	});
});
