'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

/**
 * Client Schema
 */
var ProjectSchema = new AggregateRootSchema({
  	clientId: {
  		type: String
  	},
  	name: {
		type: String
	},
	description: {
		type: String
	},
	hidden: {
		type: Boolean,
		default: false
	},
	tasks: [{
		name: {
			type: String
		},
		defaultRateInCents: {
			type: Number
		}
	}]
});

/*
 *	Write methods
 */
ProjectSchema.statics.create = function(clientId, name, description){
	
	var project = new this();

	project.clientId = clientId;
	project.name = name;
	project.description = description;

	project.tasks = [
		{ name: 'Development', defaultRateInCents: 0 },		
		{ name: 'Analyse', defaultRateInCents: 0 },
		{ name: 'Meeting', defaultRateInCents: 0 }
	];

	project.apply('ProjectCreated', 
	{
		clientId: clientId,
		name: name,
		description: description
	});	

	project.apply('ProjectTasksChanged', {
		tasks: project.tasks
	})	

	return project;
};

ProjectSchema.methods.changeDetails = function(name, description){

	this.name = name;
	this.description = description;

	this.apply('ProjectDetailsChanged', 
	{
		name: name,
		description: description
	});	
};

ProjectSchema.methods.changeTasks = function(tasks){

	this.tasks = tasks;

	this.apply('ProjectTasksChanged', 
	{
		tasks: tasks
	});	
};

ProjectSchema.methods.hide = function(){

	this.hidden = true;

	this.apply('ProjectHidden', {});	
};

ProjectSchema.methods.unhide = function(){

	this.hidden = false;

	this.apply('ProjectUnhidden', {});	
};

mongoose.model('Project', ProjectSchema);
