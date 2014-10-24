'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	TimeRegistration = mongoose.model('TimeRegistration');

function convert(timeRegistration){
	return {
		id: timeRegistration.id,
		companyId: timeRegistration.companyId,
		projectId: timeRegistration.projectId,
		task: timeRegistration.task,
		description: timeRegistration.description,
		date: timeRegistration.date,
		from: timeRegistration.from,
		to: timeRegistration.to,
		totalMinutes: timeRegistration.totalMinutes()
	};
}

exports.getById = function(req, res, next) {

	TimeRegistration.findOne(
	{ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	}, 
	function(err, timeRegistration) {
		if(timeRegistration)
			res.send(convert(timeRegistration));
		else next();
	});
}

exports.getAll = function(req, res) {

	TimeRegistration.find(
	{ 
		tenant: req.user.id ,
		deleted: false
	},
	function(err, timeRegistrations) 
	{
		res.send(_.map(timeRegistrations, convert));
	});
}

exports.create = function(req, res, next) {

	var timeRegistration = TimeRegistration.create(req.user.id, req.body.companyId, req.body.projectId, req.body.task, req.body.description, req.body.date, req.body.from, req.body.to);
	timeRegistration.save(function(err){
		if(err){ next(err); }                           
		res.send(convert(timeRegistration));
	});
}

exports.update = function(req, res, next) {
	
	TimeRegistration.findOne(
	{ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	}, 
	function(err, timeRegistration) {
		if(err){ next(err); }

		if(timeRegistration){
			timeRegistration.changeDetails(req.body.companyId, req.body.projectId, req.body.task, req.body.description, req.body.date, req.body.from, req.body.to);
			timeRegistration.save(function(err){
				if(err){ next(err); }
				res.send(convert(timeRegistration));
			});
		}
		else next();
	});
}