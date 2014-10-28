'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async'),
	TimeRegistration = mongoose.model('TimeRegistration'),
	Project = mongoose.model('Project'),
	Company = mongoose.model('Company');

/**
 * Private helpers.
 */
function convert(timeRegistration, company, project) {

	return {
		id: timeRegistration.id,
		companyId: timeRegistration.companyId,
		company: {
			name: company.name
		},
		projectId: timeRegistration.projectId,
		project: {
			name: project.name,
			description: project.description
		},
		task: timeRegistration.task,
		description: timeRegistration.description,
		date: timeRegistration.date,
		from: timeRegistration.from,
		to: timeRegistration.to,
		totalMinutes: timeRegistration.totalMinutes()
	};
}

function convertSingle(timeregistration, done){

	var project;
	var company;

	async.parallel([
		function(done){
			Company.findById(timeregistration.companyId, function(err, c) { company = c; done(); })
		},
		function(done){
			Project.findById(timeregistration.projectId, function(err, p) { project = p; done(); });
		}
	], 
	function(){
		done(convert(timeregistration, company, project));
	});
}

function convertMultiple(timeRegistrations, done) {

	var projects;
	var companies;

	var companyIds = _.map(timeRegistrations, function(tr) { return tr.companyId; });
	var projectIds = _.map(timeRegistrations, function(tr) { return tr.projectId; });

	async.parallel([
		function(done){
			Company.find().in('_id', companyIds).exec(function(err, c) { companies = c; done(); })
		},
		function(done){
			Project.find().in('_id', projectIds).exec(function(err, p) { projects = p; done(); });
		}
	], 
	function(){
		var converted = _.map(timeRegistrations, function(tr) {
			return convert(tr,
				_.first(_.where(companies, { id: tr.companyId })),
				_.first(_.where(projects, { id: tr.projectId })));
		});

		done(converted);
	});
}	

/**
 * API Actions.
 */
exports.getById = function(req, res, next) {

	TimeRegistration.findOne(
	{ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	}, 
	function(err, timeRegistration) {
		if(timeRegistration)
		{
			convertSingle(timeRegistration, function(converted){
				res.send(converted);
			});
		}
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
		convertMultiple(timeRegistrations, function(converted){
			console.log(converted);
			res.send(converted);
		});
	});
}

exports.create = function(req, res, next) {

	var timeRegistration = TimeRegistration.create(req.user.id, req.body.companyId, req.body.projectId, req.body.task, req.body.description, req.body.date, req.body.from, req.body.to);
	timeRegistration.save(function(err){
		if(err){ next(err); }                           
		convertSingle(timeRegistration, function(converted){
			res.send(converted);
		});
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
				convertSingle(timeRegistration, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
}