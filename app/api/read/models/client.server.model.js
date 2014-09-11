'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Client Schema
 */
var ClientSchema = new Schema({
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
	createdOn: {
		type: Date,
		default: Date.now
	}
});

mongoose.model('Client', ClientSchema);
