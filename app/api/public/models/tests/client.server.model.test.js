'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	Client = mongoose.model('Client');


describe('Client Model Unit Tests:', function() {

	describe('When an client is created', function() {

		var original, saved;

		before(function(done) {
			original = Client.create('John Doe');
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
				_id: original._id
			}, function(err, client) {

				should.not.exist(err);
				should.exist(client);

				saved = client;

				done();
			});
		});

		it('should have a name', function(){
			saved.name.should.eql('John Doe');
		});

		it('should have version 1', function(){
			saved.version.should.eql(1);
		});

		it('should have a created event', function(){
			saved.events[0].name.should.eql('John Doe');

			saved.events[0].metadata.eventName.should.eql('ClientCreated');
		});

		it('should have created on date', function(){
			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Client.remove(done);
		});
	});


	describe('When a client details is changed', function() {

		var original, saved;

		before(function(done) {
			original = Client.create('John Doe');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Client.findOne({
				_id: original._id
			}, function(finderr, client) {

				should.not.exist(finderr);

				client.changeDetails('Jane Doe')

				client.save(function(saveerr){
					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Client.findOne({
				_id: original._id
			}, function(err, client) {

				should.not.exist(err);
				should.exist(client);

				saved = client;

				done();
			});
		});

		it('should have an updated name', function(){
			saved.name.should.eql('Jane Doe');
		});

		it('should have the same created on date', function(){
			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function(){
			saved.version.should.eql(2);
		});

		it('should have a details changed event', function(){
			saved.events[1].name.should.eql('Jane Doe');

			saved.events[1].metadata.eventName.should.eql('ClientDetailsChanged');
		});

		after(function(done) {
			Client.remove(done);
		});
	});
});