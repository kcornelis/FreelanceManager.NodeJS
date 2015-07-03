'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	Company = mongoose.model('Company'),
	convert = require('../company');

describe('Company Converter Unit Tests:', function() {

	describe('When an company is converted to a dto', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto(Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'}));
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a number', function() {
			converted.number.should.eql('1');
		});

		it('should have a name', function() {
			converted.name.should.eql('John Doe');
		});

		it('should have a vat number', function() {
			converted.vatNumber.should.eql('BE123');
		});

		it('should have an address', function() {
			converted.address.line1.should.eql('kerkstraat');
			converted.address.line2.should.eql('tav me');
			converted.address.postalcode.should.eql('1000');
			converted.address.city.should.eql('brussel');
		});
	});

	describe('When multiple companies are converted to dtos', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto([
				Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'}),
				Company.create(2, '2', 'Jane Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'})
			]);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].name.should.eql('John Doe');
			converted[1].name.should.eql('Jane Doe');

			converted[0].number.should.eql('1');
			converted[1].number.should.eql('2');
		});
	});

	describe('When an company is converted to a dto with a promise', function() {

		var converted;

		beforeEach(function(done) {

			convert.toDtoQ(Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'}))
				.then(function(a) { converted = a; })
				.finally(done)
				.done();
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a number', function() {
			converted.number.should.eql('1');
		});

		it('should have a name', function() {
			converted.name.should.eql('John Doe');
		});

		it('should have a vat number', function() {
			converted.vatNumber.should.eql('BE123');
		});

		it('should have an address', function() {
			converted.address.line1.should.eql('kerkstraat');
			converted.address.line2.should.eql('tav me');
			converted.address.postalcode.should.eql('1000');
			converted.address.city.should.eql('brussel');

		});
	});
});
