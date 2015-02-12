'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	util = require('util'),
	uuid = require('node-uuid'),
	Schema = mongoose.Schema;

function AggregateRootSchema() {
	Schema.apply(this, arguments);

	this.add({
		_id: { 
			type: String, 
			default: function genUUID () { return uuid.v1(); }
		},
		version: {
			type: Number,
			default: 0
		},
		events: {
			type: []
		},
		createdOn: {
			type: Date,
			default: Date.now
		}
	});

	this.virtual('id').get(function () {
	  return this._id;
	});

	function addMetadataToEvent(aggregate, event, eventName, eventVersion) {
		event.aggregateRootId = aggregate._id;
		event.metadata = {
			eventId: uuid.v1(),
			eventName: eventName,
			eventVersion: eventVersion,
			eventCreatedOn: Date.now()
		};
	}

	this.methods.apply = function(eventName, event) {
		this.version += 1;
		addMetadataToEvent(this, event, eventName, this._version);
		this.events.push(event);
	};
}

util.inherits(AggregateRootSchema, Schema);

module.exports = AggregateRootSchema;


