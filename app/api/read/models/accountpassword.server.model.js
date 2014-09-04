'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
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

mongoose.model('AccountPassword', AccountPasswordSchema);
