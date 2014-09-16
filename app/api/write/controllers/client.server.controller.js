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
exports.create = function(req, res, next) {

	var id = uuid.v1();
	var client = new Client(id, req.body.name);
	repository.save(client, function(err){
		if(err){ next(err); }
		res.send({ id: id });
	});
};

/**
 * Update a client
 */
exports.update = function(req, res) {
	repository.getById(new Client(req.params.clientId), function(err, client){
		if(err){ next(err); }
		client.changeDetails(req.body.name);
		repository.save(client, function(err){
			if(err){ next(err); }
			res.send({ id: client.aggregateRootId });
		});
	});
};