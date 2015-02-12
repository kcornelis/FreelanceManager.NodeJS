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
	tenant: {
		type: String,
		required: true,
		index: true
	},
	companyId: {
		type: String,
		required: true,
		index: true
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		trim: true
	},
	hidden: {
		type: Boolean,
		default: false,
		index: true
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
ProjectSchema.statics.create = function(tenant, companyId, name, description){
	
	var project = new this();

	project.companyId = companyId;
	project.name = name;
	project.description = description;
	project.tenant = tenant;

	project.tasks = [
		{ name: 'Development', defaultRateInCents: 0 },		
		{ name: 'Analyse', defaultRateInCents: 0 },
		{ name: 'Meeting', defaultRateInCents: 0 }
	];

	project.apply('ProjectCreated', 
	{
		tenant: tenant,
		companyId: companyId,
		name: name,
		description: description
	});	

	project.apply('ProjectTasksChanged', {
		tasks: project.tasks
	});

	return project;
};

ProjectSchema.methods.changeDetails = function(name, description){

	if( this.name !== name ||
		this.description !== description){
		
		this.name = name;
		this.description = description;

		this.apply('ProjectDetailsChanged', 
		{
			name: name,
			description: description
		});	
	}
};

ProjectSchema.methods.changeTasks = function(tasks){

	if(!tasks)
		return;
	
	var changed = false;
	if (tasks.length !== this.tasks.length){
		changed = true;
	}
	else {

		for(var i = 0; i < tasks.length; i++){

			if (tasks[i].name !== this.tasks[i].name ||
				tasks[i].defaultRateInCents !== this.tasks[i].defaultRateInCents)
			{
				changed = true;
				break;
			}
		}
	}

	if(changed){
		this.tasks = tasks;
	
		this.apply('ProjectTasksChanged', 
		{
			tasks: tasks
		});	
	}
};

ProjectSchema.methods.hide = function(){

	if(!this.hidden){
		this.hidden = true;
		this.apply('ProjectHidden', {});	
	}
};

ProjectSchema.methods.unhide = function(){

	if(this.hidden){
		this.hidden = false;	
		this.apply('ProjectUnhidden', {});	
	}
};

mongoose.model('Project', ProjectSchema);
