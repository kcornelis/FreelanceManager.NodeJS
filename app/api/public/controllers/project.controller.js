'use strict';

var mongoose = require('mongoose-q')(),
	_ = require('lodash'),
	convert = require('../converters/project'),
	Project = mongoose.model('Project'),
	Company = mongoose.model('Company');

function getCompany(project) {
	return project ? [project, Company.findByIdQ(project.companyId)] : function() {};
}

function getCompanies(projects) {
	var companyIds = _.map(projects, 'companyId');
	return [projects, Company.find().in('_id', companyIds).execQ()];
}

exports.getById = function(req, res, next) {

	Project.findOneQ({ 
		_id: req.params.projectId,
		tenant: req.user.id
	})
	.then(getCompany)
	.spread(function(p, c) {
		if(p) res.send(convert.toDtoWithCompany(p, c));
		else next(); // time registration not found
	})
	.catch(next)
	.done();
};

exports.getAll = function(req, res, next) {

	Project.findQ({ tenant: req.user.id })
		.then(getCompanies)
		.spread(convert.toDtoWithCompanyQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getActive = function(req, res, next) {

	Project.findQ({ tenant: req.user.id, hidden: false })
		.then(getCompanies)
		.spread(convert.toDtoWithCompanyQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.create = function(req, res, next) {

	var project = Project.create(req.user.id, req.body.companyId, req.body.name, req.body.description);
	
	project.saveQ()
		.then(getCompany)
		.spread(convert.toDtoWithCompanyQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.update = function(req, res, next) {

	Project.findOneQ({ 
		_id: req.params.projectId,
		tenant: req.user.id
	})
	.then(function(project) {
		if(project) {
			project.changeDetails(req.body.name, req.body.description);
			return project.saveQ().then(getCompany).spread(convert.toDtoWithCompanyQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // project not found
	})
	.catch(next)
	.done();
};

exports.hide = function(req, res, next) {
	
	Project.findOneQ({ 
		_id: req.params.projectId,
		tenant: req.user.id
	})
	.then(function(project) {
		if(project) {
			project.hide();
			return project.saveQ().then(getCompany).spread(convert.toDtoWithCompanyQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // project not found
	})
	.catch(next)
	.done();
};

exports.unhide = function(req, res, next) {
	
	Project.findOneQ({ 
		_id: req.params.projectId,
		tenant: req.user.id
	})
	.then(function(project) {
		if(project) {
			project.unhide();
			return project.saveQ().then(getCompany).spread(convert.toDtoWithCompanyQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // project not found
	})
	.catch(next)
	.done();
};

exports.changeTasks = function(req, res, next) {

	Project.findOneQ({ 
		_id: req.params.projectId,
		tenant: req.user.id
	})
	.then(function(project) {
		if(project) {
			project.changeTasks(req.body);
			return project.saveQ().then(getCompany).spread(convert.toDtoWithCompanyQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // project not found
	})
	.catch(next)
	.done();
};
