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
	tenant: {
		type: String,
		required: true,
		index: true
	},
  	name: {
		type: String,
		required: true,
		trim: true
	}
});

/*
 *	Write methods
 */

CompanySchema.statics.create = function(tenant, name){
	
	var company = new this();

	company.name = name;
	company.tenant = tenant;

	company.apply('CompanyCreated', 
	{
		tenant: tenant,
		name: name
	});		

	return company;
};

CompanySchema.methods.changeDetails = function(name){

	if(this.name !== name){
		
		this.name = name;
		
		this.apply('CompanyDetailsChanged', 
		{
			name: name
		});	
	}
};

mongoose.model('Company', CompanySchema);
