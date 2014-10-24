'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

/**
 * Validators
 */	
var yearValidation = [function(v){ return v >= 1900 && v <= 2200; }, 'Path `{PATH}` ({VALUE}) should be between 1900 and 2200'];
var monthValidation = [function(v){ return v >= 1 && v <= 12; }, 'Path `{PATH}` ({VALUE}) should be between 1 and 12'];
var dayValidation = [function(v){ return v >= 1 && v <= 31; }, 'Path `{PATH}` ({VALUE}) should be between 1 and 31'];
var hourValidation = [function(v){ return v >= 0 && v <= 23; }, 'Path `{PATH}` ({VALUE}) should be between 0 and 23'];
var minuteValidation = [function(v){ return v >= 0 && v <= 59; }, 'Path `{PATH}` ({VALUE}) should be between 0 and 59'];

/**
 * TimeRegistration Schema
 */
var TimeRegistrationSchema = new AggregateRootSchema({
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
	projectId: {
		type: String,
		required: true,
		index: true
	},
	task:{
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		trim: true
	},
	date: {
		year: { type: Number, required: true, validate: yearValidation },
		month: { type: Number, required: true, validate: monthValidation },
		day: { type: Number, required: true, validate: dayValidation },
		numeric: { type: Number, required: true }
	},
	from: {
		hour: { type: Number, required: true, validate: hourValidation },
		minutes: { type: Number, required: true, validate: minuteValidation },
		numeric: { type: Number }
	},
	to: {
		hour: { type: Number, required: true, validate: hourValidation },
		minutes: { type: Number, required: true, validate: minuteValidation },
		numeric: { type: Number }
	},
	deleted: {
		type: Boolean
	},
	deletedOn: {
		type: Date
	}
});

/*
 *	Private methods
 */
function createDateObject(date){

	if(!date)
		return;

	var year = Math.floor(date / 10000);
	var month = Math.floor((date - (year * 10000)) / 100);
	var day = Math.floor(date - (year * 10000) - (month * 100));

	return {
		numeric: date,
		year: year,
		month: month,
		day: day
	};
}

function createTimeObject(time){

	if(!time)
		return;

	var hour = Math.floor(time / 100);
	var minutes = Math.floor(time - (hour * 100));

	return {
		numeric: time,
		hour: hour,
		minutes: minutes
	};
}

/*
 *      Write methods
 */
TimeRegistrationSchema.statics.create = function(tenant, companyId, projectId, task, description, date, from, to){
	
	var timeRegistration = new this();

	timeRegistration.tenant = tenant;
	timeRegistration.companyId = companyId;
	timeRegistration.projectId = projectId;
	timeRegistration.task = task;
	timeRegistration.description = description;
	timeRegistration.date = createDateObject(date);
	timeRegistration.from = createTimeObject(from);
	timeRegistration.to = createTimeObject(to);

	timeRegistration.apply('TimeRegistrationCreated', 
	{
		tenant: tenant,
		companyId: companyId,
		projectId: projectId,
		task: task,
		description: description,
		date: date,
		from: from,
		to: to
	});             

	return timeRegistration;
};

TimeRegistrationSchema.methods.changeDetails = function(companyId, projectId, task, description, date, from, to){

	if( this.companyId != companyId ||
		this.projectId != projectId ||
		this.task != task ||
		this.description != description ||
		this.date.numeric != date ||
		this.from.numeric != from ||
		this.to.numeric != to){

		this.companyId = companyId;
		this.projectId = projectId;
		this.task = task;
		this.description = description;
		this.date = createDateObject(date);
		this.from = createTimeObject(from);
		this.to = createTimeObject(to);
		
		this.apply('TimeRegistrationDetailsChanged', 
		{
			companyId: companyId,
			projectId: projectId,
			task: task,
			description: description,
			date: date,
			from: from,
			to: to
		});     
	}
};

TimeRegistrationSchema.methods.totalMinutes = function(){

	var difference = ((this.to.hour * 60) + this.to.minutes) - ((this.from.hour * 60) + this.from.minutes);

	if (difference < 0)
		difference = ((60 * 24) + difference);

	return difference;
};

mongoose.model('TimeRegistration', TimeRegistrationSchema);
