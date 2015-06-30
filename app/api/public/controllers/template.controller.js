'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Template = mongoose.model('Template');

/**
 * Private helpers.
 */
function convert(template) {

	return {
		id: template.id,
		name: template.name,
		content: template.content,
		hidden: template.hidden
	};
}

function convertSingle(template, done) {


	done(convert(template));
}

function convertMultiple(templates, done) {

	var converted = _.map(templates, function(t) {
		return convert(t);
	});

	done(converted);
}

exports.getById = function(req, res, next) {

	Template.findOne(
	{
		_id: req.params.templateId,
		tenant: req.user.id
	}, 
	function(err, template) 
	{
		if(template)
		{
			convertSingle(template, function(converted) {

				res.send(converted);
			});
		}
		else next();
	});
};

exports.getAll = function(req, res) {

	Template.find({ tenant: req.user.id },function(err, templates) {
		convertMultiple(templates, function(converted) {

			res.send(converted);
		});
	});
};

exports.getActive = function(req, res) {


	Template.find({ tenant: req.user.id, hidden: false },function(err, templates) {
		convertMultiple(templates, function(converted) {

			res.send(converted);
		});
	});
};

exports.create = function(req, res, next) {

	var template = Template.create(req.user.id, req.body.name, req.body.content);
	template.save(function(err) {

		if(err) next(err);    
		else convertSingle(template, function(converted) {

			res.send(converted);
		});
	});
};

exports.update = function(req, res, next) {
	
	Template.findOne(
	{
		_id: req.params.templateId,
		tenant: req.user.id
	}, 
	function(err, template) {
		if(err) next(err);
		else if(template) {

			template.changeDetails(req.body.name, req.body.content);
			template.save(function(err) {

				if(err) next(err);
				else convertSingle(template, function(converted) {

					res.send(converted);
				});
			});
		}
		else next();
	});
};

exports.hide = function(req, res, next) {
	
	Template.findOne(
	{
		_id: req.params.templateId,
		tenant: req.user.id
	}, 
	function(err, template) {
		if(err) next(err);
		else if(template) {

			template.hide();
			template.save(function(err) {

				if(err) next(err);
				else convertSingle(template, function(converted) {

					res.send(converted);
				});
			});
		}
		else next();
	});
};

exports.unhide = function(req, res, next) {
	
	Template.findOne(
	{
		_id: req.params.templateId,
		tenant: req.user.id
	}, 
	function(err, template) {
		if(err) next(err);
		else if(template) {

			template.unhide();
			template.save(function(err) {

				if(err) next(err);
				else convertSingle(template, function(converted) {

					res.send(converted);
				});
			});
		}
		else next();
	});
};