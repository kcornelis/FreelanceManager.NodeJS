'use strict';

var mongoose = require('mongoose-q')(),
	convert = require('../converters/company'),
	Company = mongoose.model('Company');

exports.getById = function(req, res, next) {

	Company.findOneQ({ 
		_id: req.params.companyId,
		tenant: req.user.id
	})
	.then(convert.toDtoQ)
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // company not found
	})
	.catch(next)
	.done();
};

exports.getAll = function(req, res, next) {

	Company.findQ({ tenant: req.user.id })
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.create = function(req, res, next) {

	Company.getNextNumberQ(req.user.id)
		.then(function(number) {
			var company = Company.create(req.user.id, number, req.body.name, req.body.vatNumber, req.body.address);
			return company.saveQ();
		})
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.update = function(req, res, next) {
	
	Company.findOneQ({ 
		_id: req.params.companyId,
		tenant: req.user.id
	})
	.then(function(company) {
		if(company) {
			company.changeDetails(req.body.name, req.body.vatNumber, req.body.address);
			return company.saveQ().then(convert.toDtoQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // company not found
	})
	.catch(next)
	.done();
};
