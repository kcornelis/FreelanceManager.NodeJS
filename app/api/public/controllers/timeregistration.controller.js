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
		totalMinutes: timeRegistration.totalMinutes
	};
}

function convertSingle(timeregistration, done){

	var project;
	var company;

	async.parallel([
		function(done){
			Company.findById(timeregistration.companyId, function(err, c) { company = c; done(); });
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
			Company.find().in('_id', companyIds).exec(function(err, c) { companies = c; done(); });
		},
		function(done){
			Project.find().in('_id', projectIds).exec(function(err, p) { projects = p; done(); });
		}
	], 
	function(){
		var converted = _.map(timeRegistrations, function(tr) {
			return convert(tr,
				_.find(companies, { id: tr.companyId }),
				_.find(projects, { id: tr.projectId }));
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
};

exports.getAll = function(req, res, next) {

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
};

exports.getForDate = function(req, res, next) {

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
};

exports.search = function(req, res, next) {

	var searchOptions = {
		tenant: req.user.id,
		deleted: false
	};

	if(!_.isUndefined(req.query.from))
		_.merge(searchOptions, { 'date.numeric': { $gte: req.query.from } });

	if(!_.isUndefined(req.query.to))
		_.merge(searchOptions, { 'date.numeric': { $lte: req.query.to } });

	if(!_.isUndefined(req.query.project))
		searchOptions.projectId = req.query.project;

	if(!_.isUndefined(req.query.invoiced))
		searchOptions.invoiced = req.query.invoiced;

	if(!_.isUndefined(req.query.billable))
		searchOptions.billable = req.query.billable;

	TimeRegistration.find(searchOptions, function(err, timeRegistrations) 
	{
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){
			res.send(converted);
		});
	});
};

exports.getForRange = function(req, res, next) {

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
};

exports.getUninvoiced = function(req, res, next){

	TimeRegistration.find(
	{ 
		tenant: req.user.id,
		deleted: false,
		invoiced: false,
		billable: true
	},
	function(err, timeRegistrations) 
	{
		if(err) next(err);
		else convertMultiple(timeRegistrations, function(converted){
			res.send(converted);
		});
	});
};

exports.getInfoForPeriod = function(req, res, next){

	TimeRegistration.aggregate([
	{
		$match: {
			tenant: req.user.id,
			deleted: false,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		}
	},
	{ 	
		$group: { 
			_id: null, 
			count: { $sum: 1 }, 
			billable: { $sum: { $cond: [ '$billable', '$totalMinutes', 0 ] } },
			total: { $sum: '$totalMinutes' }
		}
	}], 
	function (err, result) {

		if(err) next(err);
		else res.send({
			count: (result[0] ? result[0].count : 0),
			billableMinutes: (result[0] ? result[0].billable : 0),
			unBillableMinutes: (result[0] ? result[0].total - result[0].billable : 0)
		});
	});	
};

exports.getInfoForPeriodPerTask = function(req, res, next){
	
	TimeRegistration.aggregate([
	{
		$match: {
			tenant: req.user.id,
			deleted: false,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		}
	},
	{ 	
		$group: { 
			_id: { companyId: '$companyId', projectId: '$projectId', task: '$task' }, 
			count: { $sum: 1 }, 
			billable: { $sum: { $cond: [ '$billable', '$totalMinutes', 0 ] } },
			total: { $sum: '$totalMinutes' }
		}
	}], 
	function (err, result) {
		
		if(err) next(err);
		else
		{ 
			var projects;
			var companies;

			var companyIds = _.uniq(_.map(result, function(tr) { return tr._id.companyId; }));
			var projectIds = _.uniq(_.map(result, function(tr) { return tr._id.projectId; }));

			async.parallel([
				function(done){
					Company.find().in('_id', companyIds).exec(function(err, c) { companies = c; done(); });
				},
				function(done){
					Project.find().in('_id', projectIds).exec(function(err, p) { projects = p; done(); });
				}
			], 
			function(){

				res.send(_.map(result, function(r){
					return {
						companyId: r._id.companyId,
						company: _.first(_.where(companies, { id: r._id.companyId })),
						projectId: r._id.projectId,
						project: _.first(_.where(projects, { id: r._id.projectId })),
						task: r._id.task,
						count: r.count,
						billableMinutes: r.billable,
						unBillableMinutes: r.total - r.billable
					};
				}));
			});
		}
	});	
};

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

	if(domainTimeRegistrations.length === 1){
		convertSingle(domainTimeRegistrations[0], function(converted){
			res.send(converted);
		});
	}
	else{
		convertMultiple(domainTimeRegistrations, function(converted){
			res.send(converted);
		});
	}
};

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
				if(err) next(err);
				else convertSingle(timeRegistration, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
};


exports.delete = function(req, res, next) {
	
	TimeRegistration.findOne(
	{ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	}, 
	function(err, timeRegistration) {
		if(err) next(err);
		else if(timeRegistration){
			timeRegistration.delete();
			timeRegistration.save(function(err){
				if(err) next(err);
				else res.send({ deleted: req.params.timeRegistrationId });
			});
		}
		else next();
	});
};