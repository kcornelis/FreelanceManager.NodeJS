'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Account = mongoose.model('Account');

/**
 * Create a article
 */
exports.getById = function(req, res) {

	Account.findOne({
		aggregateRootId: req.params.accountId
	}, function(err, account) {
		res.send(account);
	});
};

exports.getAll = function(req, res) {

	Account.find({ },function(err, accounts) {
		res.send(accounts);
	});
};