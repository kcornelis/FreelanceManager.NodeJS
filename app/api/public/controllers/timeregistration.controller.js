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
		billable: timeRegistration.billable,
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
		if(err) next(err);
		else if(timeRegistration)
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
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){
			res.send(converted);
		});
	});
}

exports.getForDate = function(req, res) {

	TimeRegistration.find(
	{ 
		tenant: req.user.id,
		deleted: false,
		'date.numeric': req.params.date
	},
	function(err, timeRegistrations) 
	{
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){
			res.send(converted);
		});
	});
}

exports.getForRange = function(req, res) {

	TimeRegistration.find(
	{ 
		tenant: req.user.id,
		deleted: false,
		'date.numeric': { $gte: req.params.from, $lte: req.params.to }
	},
	function(err, timeRegistrations) 
	{
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){
			res.send(converted);
		});
	});
}

exports.getInfo = function(req, res) {

	TimeRegistration.find(
	{ 
		tenant: req.user.id,
		deleted: false,
		'date.numeric': { $gte: req.params.from, $lte: req.params.to }
	},
	function(err, timeRegistrations) 
	{
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){

			var summary =
			{
				count: converted.length,
				billableMinutes: _.reduce(converted, function(sum, current) {  
					if(current.billable)
						return sum + current.totalMinutes;
					else return sum;
				}, 0),
				unBillableMinutes: _.reduce(converted, function(sum, current) {  
					if(!current.billable)
						return sum + current.totalMinutes;
					else return sum;
				}, 0)
			};

			var groupedPerTask = _.groupBy(converted, function(i) { 
				return JSON.stringify({ 
					c: i.companyId,
					p: i.projectId,
					t: i.task
				});
			});

			var perTask = _.map(groupedPerTask, function (g) {
				return {
					companyId: g[0].companyId,
					company: g[0].company,
					projectId: g[0].projectId,
					project: g[0].project,
					task: g[0].task,
					count: g.length,
					billableMinutes: _.reduce(g, function(sum, current) {  
						if(current.billable)
							return sum + current.totalMinutes;
						else return sum;
					}, 0),
					unBillableMinutes: _.reduce(g, function(sum, current) {  
						if(!current.billable)
							return sum + current.totalMinutes;
						else return sum;
					}, 0)
				};
			});

			res.send({
				summary: summary,
				perTask: perTask
			});
		});
	});
}

exports.create = function(req, res, next) {

	var timeRegistrations = req.body;
	var domainTimeRegistrations = [];

	if(!_.isArray(timeRegistrations)){
		timeRegistrations = [ req.body ];
	}
	
	_.forEach(timeRegistrations, function (timeRegistration){
		var domainTimeRegistration = TimeRegistration.create(req.user.id, 
			timeRegistration.companyId, timeRegistration.projectId, timeRegistration.task, 
			timeRegistration.billable, timeRegistration.description, 
			timeRegistration.date, timeRegistration.from, timeRegistration.to);
		domainTimeRegistrations.push(domainTimeRegistration);
		domainTimeRegistration.save(function(err){
			if(err) 
				next(err);		
		});
	});

	if(domainTimeRegistrations.length == 1){
		convertSingle(domainTimeRegistrations[0], function(converted){
			res.send(converted);
		});
	}
	else{
		convertMultiple(domainTimeRegistrations, function(converted){
			res.send(converted);
		});
	}
}

exports.update = function(req, res, next) {
	
	TimeRegistration.findOne(
	{ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	}, 
	function(err, timeRegistration) {
		if(err) next(err);
		else if(timeRegistration){
			timeRegistration.changeDetails(req.body.companyId, req.body.projectId, req.body.task, 
				req.body.billable, req.body.description, 
				req.body.date, req.body.from, req.body.to);
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