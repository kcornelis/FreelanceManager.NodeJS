'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Client = mongoose.model('Client');

function convert(client){
	return {
		id: client.id,
		name: client.name
	};
}

exports.getById = function(req, res) {

	Client.findById(req.params.clientId, function(err, client) {
		res.send(convert(client));
	});
};

exports.getAll = function(req, res) {

	Client.find({ },function(err, clients) {
		res.send(_.map(clients, convert));
	});
};

exports.create = function(req, res, next) {

	var client = Client.create(req.body.name);
	client.save(function(err){
		if(err){ next(err); }                           
		res.send(convert(client));
	});
};

exports.update = function(req, res, next) {
	
	Client.findById(req.params.clientId, function(err, client) {
		if(err){ next(err); }
		client.changeDetails(req.body.name);
		client.save(function(err){
			if(err){ next(err); }
			res.send(convert(client));
		});
	});
};