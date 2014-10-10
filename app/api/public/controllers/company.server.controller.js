'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Company = mongoose.model('Company');

function convert(company){
	return {
		id: company.id,
		name: company.name
	};
}

exports.getById = function(req, res) {

	Company.findById(req.params.companyId, function(err, company) {
		res.send(convert(company));
	});
}

exports.getAll = function(req, res) {

	Company.find({ },function(err, companies) {
		res.send(_.map(companies, convert));
	});
}

exports.create = function(req, res, next) {

	var company = Company.create(req.body.name);
	company.save(function(err){
		if(err){ next(err); }                           
		res.send(convert(company));
	});
}

exports.update = function(req, res, next) {
	
	Company.findById(req.params.companyId, function(err, company) {
		if(err){ next(err); }
		company.changeDetails(req.body.name);
		company.save(function(err){
			if(err){ next(err); }
			res.send(convert(company));
		});
	});
}