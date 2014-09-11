'use strict';

/**
 * Module dependencies.
 */
var Client = require_domain('client'),
	repository = require_infrastructure('repository'),
	uuid = require('node-uuid');

/**
 * Create a client
 */
exports.create = function(req, res) {

	var id = uuid.v1();
	var client = new Client(id, req.body.name);
	repository.save(client, function(){
		res.send({ id: id });
	});
};

exports.update = function(req, res) {	
};