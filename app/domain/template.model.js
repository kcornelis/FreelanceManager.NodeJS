'use strict';

var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

var TemplateSchema = new AggregateRootSchema({
	tenant: {
		type: String,
		required: true,
		index: true
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	content: {
		type: String,
		trim: true
	},
	hidden: {
		type: Boolean,
		default: false,
		index: true
	}
});

TemplateSchema.statics.create = function(tenant, name, content) {

	var template = new this();

	template.name = name;
	template.content = content;
	template.tenant = tenant;

	template.apply('TemplateCreated', 
	{
		tenant: tenant,
		name: name,
		content: content
	});	

	return template;
};

TemplateSchema.methods.changeDetails = function(name, content) {

	if( this.name !== name ||
		this.content !== content) {

		this.name = name;
		this.content = content;

		this.apply('TemplateDetailsChanged', 
		{
			name: name,
			content: content
		});	
	}
};

TemplateSchema.methods.hide = function() {

	if(!this.hidden) {
		this.hidden = true;
		this.apply('TemplateHidden', {});	
	}
};

TemplateSchema.methods.unhide = function() {

	if(this.hidden) {
		this.hidden = false;	
		this.apply('TemplateUnhidden', {});	
	}
};

mongoose.model('Template', TemplateSchema);
