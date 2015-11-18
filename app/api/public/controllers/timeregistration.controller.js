'use strict';

var mongoose = require('mongoose-q')(),
	_ = require('lodash'),
	Q = require('q'),
	convert = require('../converters/timeregistration'),
	TimeRegistration = mongoose.model('TimeRegistration'),
	Project = mongoose.model('Project'),
	Company = mongoose.model('Company');

function getCompanyAndProject(timeregistration) {
	return timeregistration ? [timeregistration, 
		Company.findByIdQ(timeregistration.companyId),
		Project.findByIdQ(timeregistration.projectId)] : function() { };
}

function getCompaniesAndProjects(timeregistrations) {
	
	var companyIds = _.map(timeregistrations, 'companyId');
	var projectIds = _.map(timeregistrations, 'projectId');

	return [timeregistrations, 
		Company.find().in('_id', companyIds).execQ(),
		Project.find().in('_id', projectIds).execQ()];
}

exports.getById = function(req, res, next) {

	TimeRegistration.findOneQ({ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id
	})
	.then(getCompanyAndProject)
	.spread(function(tr, c, p) {
		if(tr) res.send(convert.toDtoWithCompanyAndProject(tr, c, p));
		else next(); // time registration not found
	})
	.catch(next)
	.done();
};

exports.getAll = function(req, res, next) {

	TimeRegistration.findQ({ tenant: req.user.id, deleted: false })
		.then(getCompaniesAndProjects)
		.spread(convert.toDtoWithCompanyAndProjectQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getLast = function(req, res, next) {

	TimeRegistration.find({ tenant: req.user.id, deleted: false })
		.sort({ createdOn: -1 })
		.limit(req.params.amount)
		.execQ()
		.then(getCompaniesAndProjects)
		.spread(convert.toDtoWithCompanyAndProjectQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getLastGroupedByDescription = function(req, res, next) {

	var limit = parseInt(req.params.amount, 10);
	TimeRegistration.aggregate()
		.match({ tenant: req.user.id, deleted: false })
		.group({ 
			_id: { companyId: '$companyId', projectId: '$projectId', task: '$task', description: '$description' },
			'last': { $max: '$createdOn' }
		})
		.sort({ last: -1 })
		.limit(limit)
		.project({
			'_id': false,
			companyId: '$_id.companyId',
			projectId: '$_id.projectId',
			task: '$_id.task',
			description: '$_id.description'
		})
		.execQ()
		.then(getCompaniesAndProjects)
		.spread(convert.toDtoWithCompanyAndProjectQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getLastGroupedByTask = function(req, res, next) {

	var limit = parseInt(req.params.amount, 10);
	TimeRegistration.aggregate()
		.match({ tenant: req.user.id, deleted: false })
		.group({ 
			_id: { companyId: '$companyId', projectId: '$projectId', task: '$task' },
			'last': { $max: '$createdOn' }
		})
		.sort({ last: -1 })
		.limit(limit)
		.project({
			'_id': false,
			companyId: '$_id.companyId',
			projectId: '$_id.projectId',
			task: '$_id.task'
		})
		.execQ()
		.then(getCompaniesAndProjects)
		.spread(convert.toDtoWithCompanyAndProjectQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getForDate = function(req, res, next) {

	TimeRegistration.findQ({ 
		tenant: req.user.id, 
		deleted: false, 
		'date.numeric': req.params.date 
	})
	.then(getCompaniesAndProjects)
	.spread(convert.toDtoWithCompanyAndProjectQ)
	.then(res.send.bind(res))
	.catch(next)
	.done();
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

	TimeRegistration.findQ(searchOptions)
		.then(getCompaniesAndProjects)
		.spread(convert.toDtoWithCompanyAndProjectQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getForRange = function(req, res, next) {

	TimeRegistration.findQ({ 
		tenant: req.user.id, 
		deleted: false, 
		'date.numeric': { $gte: req.params.from, $lte: req.params.to }
	})
	.then(getCompaniesAndProjects)
	.spread(convert.toDtoWithCompanyAndProjectQ)
	.then(res.send.bind(res))
	.catch(next)
	.done();
};

exports.getUninvoiced = function(req, res, next) {

	TimeRegistration.findQ({ 
		tenant: req.user.id,
		deleted: false,
		invoiced: false,
		billable: true 
	})
	.then(getCompaniesAndProjects)
	.spread(convert.toDtoWithCompanyAndProjectQ)
	.then(res.send.bind(res))
	.catch(next)
	.done();
};

exports.getInfoForPeriod = function(req, res, next) {

	TimeRegistration.aggregate()
		.match({
			tenant: req.user.id,
			deleted: false,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		})
		.group({ 
			_id: null, 
			count: { $sum: 1 }, 
			billable: { $sum: { $cond: [ '$billable', '$totalMinutes', 0 ] } },
			total: { $sum: '$totalMinutes' }
		})
		.execQ()
		.then(function(result) {
			res.send({
				count: (result[0] ? result[0].count : 0),
				billableMinutes: (result[0] ? result[0].billable : 0),
				unBillableMinutes: (result[0] ? result[0].total - result[0].billable : 0)
			});
		})
		.catch(next)
		.done();
};

exports.getInfoForPeriodPerTask = function(req, res, next) {

	TimeRegistration.aggregate()
		.match({
			tenant: req.user.id,
			deleted: false,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		})
		.group({ 
			_id: { companyId: '$companyId', projectId: '$projectId', task: '$task' }, 
			count: { $sum: 1 }, 
			billable: { $sum: { $cond: [ '$billable', '$totalMinutes', 0 ] } },
			total: { $sum: '$totalMinutes' }
		})
		.execQ()
		.then(function(result) {
			var companyIds = _.uniq(_.pluck(result, '_id.companyId'));
			var projectIds = _.uniq(_.pluck(result, '_id.projectId'));

			return [result, 
				Company.find({ tenant: req.user.id }).in('_id', companyIds).execQ(),
				Project.find({ tenant: req.user.id }).in('_id', projectIds).execQ()];
		})
		.spread(function(result, companies, projects) {
			res.send(_.map(result, function(r) {
				return {
					companyId: r._id.companyId,
					company: _.find(companies, { 'id': r._id.companyId }),
					projectId: r._id.projectId,
					project: _.find(projects, { 'id': r._id.projectId }),
					task: r._id.task,
					count: r.count,
					billableMinutes: r.billable,
					unBillableMinutes: r.total - r.billable
				};
			}));
		})
		.catch(next)
		.done();
};

exports.create = function(req, res, next) {

	function createPromise(timeRegistration) {
		var domainTimeRegistration = TimeRegistration.create(req.user.id, 
			timeRegistration.companyId, timeRegistration.projectId, timeRegistration.task, 
			timeRegistration.billable, timeRegistration.description, 
			timeRegistration.date, timeRegistration.from, timeRegistration.to);

		return domainTimeRegistration.saveQ()
			.then(getCompanyAndProject)
			.spread(convert.toDtoWithCompanyAndProjectQ);
	}

	var timeRegistrations = _.isArray(req.body) ? req.body : [ req.body ];

	Q.all(_.map(timeRegistrations, createPromise))
		.then(function(dtos) {
			if(dtos.length === 1)
				res.send(dtos[0]);
			else
				res.send(dtos);
		})
		.catch(next)
		.done();
};

exports.update = function(req, res, next) {
	
	TimeRegistration.findOneQ({ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	})
	.then(function(timeRegistration) {
		if(timeRegistration) {
			timeRegistration.changeDetails(req.body.companyId, req.body.projectId, req.body.task, 
				req.body.billable, req.body.description, 
				req.body.date, req.body.from, req.body.to);

			return timeRegistration.saveQ()
				.then(getCompanyAndProject)
				.spread(convert.toDtoWithCompanyAndProjectQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // time registration not found
	})
	.catch(next)
	.done();
};

exports.delete = function(req, res, next) {
	
	TimeRegistration.findOneQ({ 
		_id: req.params.timeRegistrationId,
		tenant: req.user.id,
		deleted: false
	})
	.then(function(timeRegistration) {
		if(timeRegistration) {
			timeRegistration.delete();
			return timeRegistration.saveQ();
		}
	})
	.then(function(tr) { 
		if(tr) res.send({ deleted: req.params.timeRegistrationId });
		else next(); // time registration not found
	})
	.catch(next)
	.done();
};
