'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

/**
 * TimeRegistration Schema
 */
var AccountPasswordSchema = new Schema({
	version: {
		type: Number,
		default: ''
	},
	aggregateRootId: {
		type: String,
		default: ''
	},
	email: {
		type: String,
		default: ''
	},
  	passwordHash: {
		type: String,
		default: ''
	},
	passwordSalt: {
		type: String,
		default: ''
	},
	createdOn: {
		type: Date,
		default: Date.now
	}
});

AccountPasswordSchema.methods.authenticate = function(password) {
	return this.passwordHash === crypto.pbkdf2Sync(password, new Buffer(this.passwordSalt, 'base64'), 10000, 64).toString('base64');
};

mongoose.model('AccountPassword', AccountPasswordSchema);
