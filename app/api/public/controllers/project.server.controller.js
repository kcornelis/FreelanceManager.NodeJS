'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Project = mongoose.model('Project');

function convert(project){
	return {
		id: project.id,
		companyId: project.companyId,
		name: project.name,
		description: project.description,
		tasks: project.tasks,
		hidden: project.hidden
	};
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
			res.send(convert(project));
		else next();
	});
}

exports.getAll = function(req, res) {

	Project.find({ tenant: req.user.id },function(err, projects) {
		res.send(_.map(projects, convert));
	});
}

exports.create = function(req, res, next) {

	var project = Project.create(req.user.id, req.body.companyId, req.body.name, req.body.description);
	project.save(function(err){
		if(err){ next(err); }                           
		res.send(convert(project));
	});
}

exports.update = function(req, res, next) {
	
	Project.findOne(
	{
		_id: req.params.projectId,
		tenant: req.user.id
	}, 
	function(err, project) {
		if(err){ next(err); }

		if(project){
			project.changeDetails(req.body.name, req.body.description);
			project.save(function(err){
				if(err){ next(err); }
				res.send(convert(project));
			});
		}
		else next();
	});
}