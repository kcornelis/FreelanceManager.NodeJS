'use strict';

var mongoose = require('mongoose-q')(),
	convert = require('../converters/template'),
	Template = mongoose.model('Template');

exports.getById = function(req, res, next) {

	Template.findOneQ({ 
		_id: req.params.templateId,
		tenant: req.user.id
	})
	.then(convert.toDtoQ)
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // template not found
	})
	.catch(next)
	.done();
};

exports.getAll = function(req, res, next) {

	Template.findQ({ tenant: req.user.id })
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.getActive = function(req, res, next) {

	Template.findQ({ tenant: req.user.id, hidden: false })
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.create = function(req, res, next) {

	var template = Template.create(req.user.id, req.body.name, req.body.content);
	template.saveQ()
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.update = function(req, res, next) {

	Template.findOneQ({ 
		_id: req.params.templateId,
		tenant: req.user.id
	})
	.then(function(template) {
		if(template) {
			template.changeDetails(req.body.name, req.body.content);
			return template.saveQ().then(convert.toDtoQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // template not found
	})
	.catch(next)
	.done();
};

exports.hide = function(req, res, next) {
	
	Template.findOneQ({ 
		_id: req.params.templateId,
		tenant: req.user.id
	})
	.then(function(template) {
		if(template) {
			template.hide();
			return template.saveQ().then(convert.toDtoQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // template not found
	})
	.catch(next)
	.done();
};

exports.unhide = function(req, res, next) {
	
	Template.findOneQ({ 
		_id: req.params.templateId,
		tenant: req.user.id
	})
	.then(function(template) {
		if(template) {
			template.unhide();
			return template.saveQ().then(convert.toDtoQ);
		}
	})
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // template not found
	})
	.catch(next)
	.done();
};
