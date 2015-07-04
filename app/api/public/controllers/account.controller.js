'use strict';

var mongoose = require('mongoose-q')(),
	convert = require('../converters/account'),
	Account = mongoose.model('Account');

exports.getById = function(req, res, next) {

	Account.findByIdQ(req.params.accountId)
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getAll = function(req, res, next) {

	Account.findQ()
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.create = function(req, res, next) {

	var account = Account.create(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
	account.saveQ()
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.update = function(req, res, next) {	

	if(req.user.id !== req.params.accountId)
		return next();

	Account.findByIdQ(req.params.accountId)
		.then(function(account) {
			if(account) {
				account.changeDetails(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
				return account.saveQ().then(convert.toDtoQ);
			}
		})
		.then(function(dto) { 
			if(dto) res.send(dto);
			else next(); // account not found
		})
		.catch(next)
		.done();
};

exports.changepassword = function(req, res, next) {
	
	if(req.user.id !== req.params.accountId)
		return next();

	Account.findByIdQ(req.params.accountId)
		.then(function(account) {
			if(account && account.authenticate(req.body.oldPassword)) {
				account.changePassword(req.body.newPassword);
				return account.saveQ().then(convert.toDtoQ);
			}
		})
		.then(function(dto) { 
			if(dto) res.send({ ok: true });
			else next(); // account not found
		})
		.catch(next)
		.done();
};
