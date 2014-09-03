'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Account = mongoose.model('Account'),
	uuid = require('node-uuid'),
	_ = require('lodash');

/**
 * Create a article
 */
exports.getById = function(req, res) {

	Account.findOne({
		aggregateRootId: req.params.accountId
	})
	.exec(function(err, account) {
		res.send(account);
	});
};

exports.getAll = function(req, res) {

	Account.find({	})
	.exec(function(err, accounts) {
		res.send(accounts);
	});
};