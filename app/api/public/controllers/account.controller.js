'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Account = mongoose.model('Account');

function convert(account) {

	return {
		id: account.id,
		name: account.name,
		firstName: account.firstName,
		lastName: account.lastName,
		email: account.email
	};
}

exports.getById = function(req, res, next) {

	Account.findById(req.params.accountId, function(err, account) {
		if(err) next(err);
		else res.send(convert(account));
	});
};

exports.getAll = function(req, res, next) {

	Account.find({ },function(err, accounts) {
		if(err) next(err);
		else res.send(_.map(accounts, convert));
	});
};

exports.create = function(req, res, next) {

	var account = Account.create(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
	account.save(function(err) {

		if(err) next(err); 
		else res.send(convert(account));
	});
};

exports.update = function(req, res, next) {	

	if(req.user.id !== req.params.accountId)
		return next();

	Account.findById(req.params.accountId, function(err, account) {

		if(err) {
 next(err); }
		else if(account) {

			account.changeDetails(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
			account.save(function(err) {

				if(err) next(err);
				else res.send(convert(account));
			});
		}
		else next();
	});
};

exports.changepassword = function(req, res, next) {
	
	if(req.user.id !== req.params.accountId)
		return next();

	Account.findById(req.params.accountId, function(err, account) {

		if(err) {
 next(err); }
		else if(account && account.authenticate(req.body.oldPassword)) {

			
			account.changePassword(req.body.newPassword);
			account.save(function(err) {

				if(err) next(err);
				else res.send({ ok: true });
			});
		}
		else next();
	});
};