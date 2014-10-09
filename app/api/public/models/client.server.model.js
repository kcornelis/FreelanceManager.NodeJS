'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

/**
 * Client Schema
 */
var ClientSchema = new AggregateRootSchema({
  	name: {
		type: String,
		default: ''
	}
});

/*
 *	Write methods
 */

ClientSchema.statics.create = function(name){
	
	var client = new this();

	client.name = name;

	client.apply('ClientCreated', 
	{
		name: name
	});		

	return client;
};

ClientSchema.methods.changeDetails = function(name){

	this.name = name;

	this.apply('ClientDetailsChanged', 
	{
		name: name
	});	
};

mongoose.model('Client', ClientSchema);
