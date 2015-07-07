'use strict';

var mongoose = require('mongoose'),
	_ = require('lodash'),
	Q = require('q'),
	AggregateRootSchema = require('./aggregateroot');

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
	},
	number: {
		type: String,
		required: true
	},
	vatNumber: {
		type: String,
		trim: true
	},
	address: {
		line1: { type: String },
		line2: { type: String },
		postalcode: { type: String },
		city: { type: String }
	}
});

CompanySchema.statics.create = function(tenant, number, name, vatNumber, address) {

	var company = new this();

	company.name = name;
	company.vatNumber = vatNumber;
	company.number = number;
	company.address = address;
	company.tenant = tenant;

	company.apply('CompanyCreated', 
	{
		tenant: tenant,
		number: number,
		name: name,
		vatNumber: vatNumber,
		address: address
	});		

	return company;
};

CompanySchema.methods.changeDetails = function(name, vatNumber, address) {

	if(this.name !== name ||
		this.vatNumber !== vatNumber ||
		_.isNull(this.address) !== _.isNull(address) ||
		_.isUndefined(this.address) !== _.isUndefined(address) ||
		(this.address && this.address.line1 !== address.line1) ||
		(this.address && this.address.line2 !== address.line2) ||
		(this.address && this.address.postalcode !== address.postalcode) ||
		(this.address && this.address.city !== address.city)) {

		
		this.name = name;
		this.vatNumber = vatNumber;
		this.address = address;
		
		this.apply('CompanyDetailsChanged', 
		{
			name: name,
			vatNumber: vatNumber,
			address: address
		});	
	}
};

CompanySchema.statics.getNextNumber = function(tenant, callback) {
	return this.count({ tenant: tenant }, function(err, count) {
		if(callback)
			callback(err, count + 1);
	});
};

CompanySchema.statics.getNextNumberQ = function(tenant) {
	var deferred = Q.defer();
	
	this.count({ tenant: tenant }, function(err, count) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(count + 1);
		}
	});

	return deferred.promise;
};

mongoose.model('Company', CompanySchema);
