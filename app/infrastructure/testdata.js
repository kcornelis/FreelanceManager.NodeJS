'use strict';

var mongoose = require('mongoose'),
	async = require('async'),
	MongoClient = require('mongodb').MongoClient,
	config = require_config(),
	Account = require('mongoose').model('Account'),
	uuid = require('node-uuid'),
	request = require('supertest'),
	jwt = require('jsonwebtoken');

var normalAccount, normalAccountToken;	

before(function(done) {


	console.log('Cleaning up old test data and create test data');

	async.series([
		function(done) {

			exports.emptyReadModel(done);
		},
		function(done) {

			exports.testUsers(done);
		}
	], done);
});

exports.emptyReadModel = function(done) {


	MongoClient.connect(config.db, function(err, db) {
	  
	  if(err) { return console.log(err); }

	  	async.series([
			function(done) {

				db.collection('accounts').remove(done);
			}
		], done);
	});
};

exports.testUsers = function(done) {


	// create a test user
	var id = uuid.v1();
	normalAccount = Account.create('John BVBA', 'John', 'Doe', id + 'john@doe.com');
	normalAccount.changePassword('12345');
	
	async.series([
		function(done) {

			normalAccount.save(done);
		}
	], function() {


		var profile = {
			email: normalAccount.email,
			id: normalAccount.id,
			firstName: normalAccount.firstName,
			lastName: normalAccount.lastName,
			fullName: normalAccount.fullName
		};

		exports.normalAccountToken = 'Bearer ' + jwt.sign(profile, config.jwtSecret, { expiresInMinutes: 60*5 });
		exports.normalAccountId = normalAccount.id;
		
		done();
	});
};