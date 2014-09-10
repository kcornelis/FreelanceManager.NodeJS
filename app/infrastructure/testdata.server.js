'use strict';

var mongoose = require('mongoose'),
	async = require('async'),
	MongoClient = require('mongodb').MongoClient,
	config = require_config(),
	Account = require_domain('account'),
	uuid = require('node-uuid'),
	request = require('supertest'),
	servicebus = require_infrastructure('servicebus'),
	jwt = require('jsonwebtoken');

var normalAccount, normalAccountToken;	

before(function(done){

	console.log('Cleaning up old test data and create test data');

	async.series([
		function(done){
			exports.emptyEventStore(done);
		},
		function(done){
			exports.emptyReadModel(done);
		},
		function(done){
			exports.testUsers(done);
		}
	], done);
});

exports.emptyEventStore = function(done){

	MongoClient.connect(config.mongo.eventstore.db, function(err, db) {
	  
		if(err) { return console.log(err); }

		async.series([
			function(done){
				db.collection('events').remove(done);
			},
			function(done){
				db.collection('snapshots').remove(done);
			}
		], done);
	});
};

exports.emptyReadModel = function(done){

	MongoClient.connect(config.db, function(err, db) {
	  
	  if(err) { return console.log(err); }

	  	async.series([
			function(done){
				db.collection('accounts').remove(done);
			},
			function(done){
				db.collection('accountpasswords').remove(done);
			}
		], done);
	});
};

exports.testUsers = function(done){

	// create a test user
	var id = uuid.v1();
	normalAccount = new Account(id, 'John BVBA', 'John', 'Doe', id + 'john@doe.com');
	normalAccount.changePassword('12345');
	
	async.series([
		function(done){
			servicebus.publishDomainEvents(
				normalAccount.getUncommittedChanges(), done);
		},
		function(done){
			servicebus.processEvents(done);
		}
	], function(){

		var profile = {
			email: normalAccount.getEmail(),
			aggregateRootId: normalAccount.getId(),
			firstName: normalAccount.getFirstName(),
			lastName: normalAccount.getLastName(),
			fullName: normalAccount.getFullName()
		};

		exports.normalAccountToken = 'Bearer ' + jwt.sign(profile, config.jwtSecret, { expiresInMinutes: 60*5 });;
		
		done();
	});
};