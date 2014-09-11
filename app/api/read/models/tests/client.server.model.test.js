'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	uuid = require('node-uuid');


/**
 * Unit tests
 */
describe('Client Model Unit Tests:', function() {

	describe('When a client is created', function() {

		var id = uuid.v1();
		var original, saved;

		before(function(done) {
			original = new Client({
				aggregateRootId: id,
				name: 'Full Name',
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
			Client.findOne({
				aggregateRootId: id
			}, function(err, client) {

				should.not.exist(err);
				should.exist(client);

				saved = client;

				done();
			});
		});

		it('should have a aggregate root id', function(){
			saved.aggregateRootId.should.eql(id);
		});

		it('should have a name', function(){
			saved.name.should.eql('Full Name');
		});

		it('should have a version', function(){
			saved.version.should.eql(2);
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Client.remove(done);
		});
	});


	describe('When a client is modified', function() {

		var id = uuid.v1();
		var original, saved;

		before(function(done) {
			original = new Client({
				aggregateRootId: id,
				name: 'Full Name',
				version: 2
			});
			
			original.save(function(err) {
				done();
			});
		});

		it('should be saved with no problems', function(done) {
			Client.findOne({
				aggregateRootId: id
			}, function(finderr, client) {

				should.not.exist(finderr);

				client.name = 'Full Name 1';
				client.version = 3;

				client.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Client.findOne({
				aggregateRootId: id
			}, function(err, client) {

				should.not.exist(err);
				should.exist(client);

				saved = client;

				done();
			});
		});

		it('should have an updated name', function(){
			saved.name.should.eql('Full Name 1');
		});

		it('should have an updated version', function(){
			saved.version.should.eql(3);
		});

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		after(function(done) {
			Client.remove(done);
		});
	});

});