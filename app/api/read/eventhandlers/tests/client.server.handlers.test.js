'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	async = require('async'),
	mongoose = require('mongoose'),
	DomainClient = require_domain('client'),
	Client = mongoose.model('Client'),
	servicebus = require_infrastructure('servicebus');


/**
 * Unit tests
 */
describe('Client Handlers Unit Tests:', function() {

	describe('When an client created event is received', function() {

		var id = uuid.v1();
		var client;

		before(function(done){
			var domainClient = new DomainClient(id, 'John Doe');
			
			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainClient.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				}
			], done);
		});

		it('should create an client', function(done){
			Client.findOne({
				aggregateRootId: id
			}, function(err, a) {

				should.not.exist(err);
				should.exist(a);
				client = a;

				done();
			});
		});	

		it('should create an client with a aggregate root id', function(){
			client.aggregateRootId.should.eql(id);
		});

		it('should create an client with a name', function(){
			client.name.should.eql('John Doe');
		});

		it('should create an client with a version', function(){
			client.version.should.eql(1);
		});
	});

	describe('When an client details changed event is received', function() {

		var id = uuid.v1();
		var client;

		before(function(done){
			var domainClient = new DomainClient(id, 'John Doe');
			domainClient.changeDetails('Jane Doe');

			async.series([
				function(done){
					servicebus.publishDomainEvents(
						domainClient.getUncommittedChanges(), done);
				},
				function(done){
					servicebus.processEvents(done);
				},
				function(done){
					Client.findOne({
						aggregateRootId: id
					}, function(err, a) {
						client = a;
						done();
					});
				}
			], done);
		});

		it('should have the correct aggregate root id', function(){
			client.aggregateRootId.should.eql(id);
		});

		it('should update the client with the new name', function(){
			client.name.should.eql('Jane Doe');
		});

		it('should update an client with the new version', function(){
			client.version.should.eql(2);
		});
	});
});
