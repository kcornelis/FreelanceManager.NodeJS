'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

/**
 * Client Schema
 */
var CompanySchema = new AggregateRootSchema({
  	name: {
		type: String,
		default: ''
	}
});

/*
 *	Write methods
 */

CompanySchema.statics.create = function(name){
	
	var company = new this();

	company.name = name;

	company.apply('CompanyCreated', 
	{
		name: name
	});		

	return company;
};

CompanySchema.methods.changeDetails = function(name){

	this.name = name;

	this.apply('CompanyDetailsChanged', 
	{
		name: name
	});	
};

mongoose.model('Company', CompanySchema);
