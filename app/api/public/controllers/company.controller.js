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
		name: company.name,
		number: company.number,
		vatNumber: company.vatNumber,
		address: company.address
	};
}

exports.getById = function(req, res, next) {

	Company.findOne(
	{ 
		_id: req.params.companyId,
		tenant: req.user.id
	}, 
	function(err, company) {
		if(company)
			res.send(convert(company));
		else next();
	});
};

exports.getAll = function(req, res) {

	Company.find({ tenant: req.user.id },function(err, companies) {
		res.send(_.map(companies, convert));
	});
};

exports.create = function(req, res, next) {

	Company.getNextNumber(req.user.id, function(err, number){

		var company = Company.create(req.user.id, number, req.body.name, req.body.vatNumber, req.body.address);
		company.save(function(err){
			if(err) next(err);                     
			else res.send(convert(company));
		});
	});
};

exports.update = function(req, res, next) {
	
	Company.findOne(
	{ 
		_id: req.params.companyId,
		tenant: req.user.id
	}, 
	function(err, company) {
		if(err) next(err);
		else if(company){
			company.changeDetails(req.body.name, req.body.vatNumber, req.body.address);
			company.save(function(err){
				if(err) next(err);
				else res.send(convert(company));
			});
		}
		else next();
	});
};