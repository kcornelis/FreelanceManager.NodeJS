/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	_ = require('lodash'),
	util = require('util'),
	Client = require_domain('client');

/**
 * Unit tests
 */
describe('Client Domain Model Unit Tests:', function() {

	describe('When a client is created', function() {

		var id = uuid.v1();
		var client = new Client(id, 'John BVBA');

		it('should have an id', function() {
			client.getId().should.eql(id);
		});

		it('should have a name', function(){
			client.getName().should.eql('John BVBA');
		});
	});

	describe('When a client details are changed', function() {

		var id = uuid.v1();
		var client = new Client(id, 'John BVBA');
		client.changeDetails('Jane BVBA');

		it('should have a new name', function(){
			client.getName().should.eql('Jane BVBA');
		});
	});	
});