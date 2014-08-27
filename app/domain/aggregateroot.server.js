'use strict';

var uuid = require('node-uuid'),
	EventEmitter = require('eventemitter2').EventEmitter2,
	_ = require('lodash');

module.exports = AggregateRoot;

function AggregateRoot(id) {
	this._id = id;
	this._version = 0;
	this._changes = [];

	this._eventEmitter = new EventEmitter();
}

function addMetadataToEvent(aggregate, event, eventName, eventVersion) {
	event.aggregateRootId = aggregate._id;
	event.metadata = {
		eventId: uuid.v1(),
		eventName: eventName,
		eventVersion: eventVersion,
		eventCreatedOn: Date.now()
	};
}

AggregateRoot.prototype = {
	
	getId: function() {
		return this._id;
	},
	getVersion: function() {
		return this._version;
	},
	getUncommittedChanges: function() {
		return this._changes;
	},
	markChangesAsCommited: function() {
		return this._changes = [];
	},
	loadFromHistory: function(history) {
		if (!_.isArray(history)) {
	      throw new Error('history should be an array!');
	    }
	    var self = this;
	    _.each(history, function(evt) {
	    	self._version += 1;
			self._eventEmitter.emit(evt.metadata.eventName, evt);
	    });
	},
	apply: function(eventName, event) {
		this._version += 1;
		addMetadataToEvent(this, event, eventName, this._version);
		this._changes.push(event);
		this._eventEmitter.emit(eventName, event);
	},
	onEvent: function(type, listener) {
		return this._eventEmitter.on(type, listener);
	}
}

