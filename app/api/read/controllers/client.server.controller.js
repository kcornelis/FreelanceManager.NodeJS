'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Client = mongoose.model('Client');

/**
 * Create a article
 */
exports.getById = function(req, res) {

	Client.findOne({
		aggregateRootId: req.params.clientId
	}, function(err, client) {
		res.send(client);
	});
};

exports.getAll = function(req, res) {

	Client.find({ }, function(err, accounts) {
		res.send(accounts);
	});
};