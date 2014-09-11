'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	  Schema = mongoose.Schema;

/**
 * Account Schema
 */
var AccountSchema = new Schema({
	version: {
		type: Number,
		default: ''
	},
	aggregateRootId: {
		type: String,
		default: ''
	},
  	name: {
		type: String,
		default: ''
	},
	firstName: {
		type: String,
		default: ''
	},
	lastName: {
		type: String,
		default: ''
	},
	email: {
		type: String,
		default: ''
	},
	admin: {
		type: Boolean,
		default: false
	},
	createdOn: {
		type: Date,
		default: Date.now
	}
});

mongoose.model('Account', AccountSchema);
