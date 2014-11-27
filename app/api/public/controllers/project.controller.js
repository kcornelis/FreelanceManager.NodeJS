'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Project = mongoose.model('Project'),
	Company = mongoose.model('Company');

/**
 * Private helpers.
 */
function convert(project, company) {

	return {
		id: project.id,
		companyId: project.companyId,
		company: {
			name: company.name
		},
		name: project.name,
		description: project.description,
		tasks: _.map(project.tasks, function(t){
			return {
				name: t.name,
				defaultRateInCents: t.defaultRateInCents,
				billable: t.defaultRateInCents > 0
			}
		}),
		hidden: project.hidden
	};
}

function convertSingle(project, done){

	Company.findById(project.companyId, function(err, company) 
	{ 
		done(convert(project, company));
	});
}

function convertMultiple(projects, done) {

	var companyIds = _.map(projects, function(p) { return p.companyId; });

	Company.find().in('_id', companyIds).exec(function(err, companies) 
	{ 
		var converted = _.map(projects, function(p) {
			return convert(p, _.first(_.where(companies, { id: p.companyId })));
		});

		done(converted);
	});
}

exports.getById = function(req, res) {

	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) 
	{
		if(project)
		{
			convertSingle(project, function(converted){
				res.send(converted);
			});
		}
		else next();
	});
}

exports.getAll = function(req, res) {

	Project.find({ tenant: req.user.id },function(err, projects) {
		convertMultiple(projects, function(converted){
			res.send(converted);
		});
	});
}

exports.getActive = function(req, res){

	Project.find({ tenant: req.user.id, hidden: false },function(err, projects) {
		convertMultiple(projects, function(converted){
			res.send(converted);
		});
	});
}

exports.create = function(req, res, next) {

	var project = Project.create(req.user.id, req.body.companyId, req.body.name, req.body.description);
	project.save(function(err){
		if(err) next(err);    
		else convertSingle(project, function(converted){
			res.send(converted);
		});
	});
}

exports.update = function(req, res, next) {
	
	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) {
		if(err) next(err);
		else if(project){
			project.changeDetails(req.body.name, req.body.description);
			project.save(function(err){
				if(err) next(err);
				else convertSingle(project, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
}

exports.hide = function(req, res, next) {
	
	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) {
		if(err) next(err);
		else if(project){
			project.hide();
			project.save(function(err){
				if(err) next(err);
				else convertSingle(project, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
}

exports.unhide = function(req, res, next) {
	
	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) {
		if(err) next(err);
		else if(project){
			project.unhide();
			project.save(function(err){
				if(err) next(err);
				else convertSingle(project, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
}

exports.changeTasks = function(req, res, next) {
	
	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) {
		if(err) next(err);
		else if(project){
			project.changeTasks(req.body);
			project.save(function(err){
				if(err) next(err);
				else convertSingle(project, function(converted){
					res.send(converted);
				});
			});
		}
		else next();
	});
}