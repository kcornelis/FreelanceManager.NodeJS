'use strict';

/**
 * Module dependencies.
 */
var Account = require_domain('account'),
	repository = require_domain('repository'),
	uuid = require('node-uuid'),
	_ = require('lodash');

/**
 * Create a article
 */
exports.create = function(req, res) {

	var id = uuid.v1();
	var account = new Account(id, req.body.name, req.body.firstName, req.body.lastName, req.body.email);
	repository.save(account, function(){
		res.send({ id: id });
	});
};

exports.update = function(req, res) {	
};

exports.changepassword = function(req, res) {
};