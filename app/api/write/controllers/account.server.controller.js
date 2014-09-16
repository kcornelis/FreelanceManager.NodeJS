'use strict';

/**
 * Module dependencies.
 */
var Account = require_domain('account'),
	repository = require_infrastructure('repository'),
	uuid = require('node-uuid'),
	_ = require('lodash');

/**
 * Create a article
 */
exports.create = function(req, res, next) {

	var id = uuid.v1();
	var account = new Account(id, req.body.name, req.body.firstName, req.body.lastName, req.body.email);
	repository.save(account, function(err){
		if(err)
			next(err);

		res.send({ id: id });
	});
};

exports.update = function(req, res) {	
};

exports.changepassword = function(req, res) {
};