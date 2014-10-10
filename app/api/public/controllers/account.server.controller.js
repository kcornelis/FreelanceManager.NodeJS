'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Account = mongoose.model('Account');

function convert(account){
	return {
		id: account.id,
		name: account.name,
		firstName: account.firstName,
		lastName: account.lastName,
		email: account.email
	};
}

exports.getById = function(req, res) {

	Account.findById(req.params.accountId, function(err, account) {
		res.send(convert(account));
	});
}

exports.getAll = function(req, res) {

	Account.find({ },function(err, accounts) {
		res.send(_.map(accounts, convert));
	});
}

exports.create = function(req, res, next) {

	var account = Account.create(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
	account.save(function(err){
		if(err){ next(err); }
		res.send(convert(account));
	});
}

exports.update = function(req, res) {	
}

exports.changepassword = function(req, res) {
}